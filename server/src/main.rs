pub mod ad_state;
pub mod db;
use actix_cors::Cors;
use actix_web::{
    middleware::Logger,
    post,
    web::{self},
    App, HttpResponse, HttpServer, Responder,
};
use arc_swap::ArcSwap;
use db::PrismaClient;
use dotenv::dotenv;
use serde::Deserialize;
use serde_json::Value;
use std::{env, sync::Arc, time::Duration};
use tokio::{runtime::Builder, time};

use crate::ad_state::AdState;

#[derive(Deserialize)]
struct Request {
    service_id: String,
    placement_group_id: String,
    user_info: Value,
}
// copy prev shared state into new struct on heap. then atomically replace Arc using ArcSwap
async fn load_ad_meta(data: web::Data<ArcSwap<Arc<AdState>>>, client: web::Data<PrismaClient>) {
    let prev = data.load();
    let mut new_ad_state = AdState {
        services: prev.services.clone(),
        placement_groups: prev.placement_groups.clone(),
        placements: prev.placements.clone(),
        campaigns: prev.campaigns.clone(),
        ad_groups: prev.ad_groups.clone(),
        creatives: prev.creatives.clone(),
        contents: prev.contents.clone(),
        update_info: prev.update_info.clone(),
        filter_index: prev.filter_index.clone(),
    };
    new_ad_state.load(client.clone().into_inner()).await;
    data.store(Arc::new(Arc::new(new_ad_state)));
}

pub async fn load_ad_meta_periodic(
    data: web::Data<ArcSwap<Arc<AdState>>>,
    client: web::Data<PrismaClient>,
    ad_meta_sync_period_millis: u64,
) {
    let mut interval = time::interval(Duration::from_millis(ad_meta_sync_period_millis));
    loop {
        interval.tick().await;
        load_ad_meta(data.clone(), client.clone()).await;
    }
}
#[post("/update_ad_meta")]
async fn update_ad_meta(
    data: web::Data<ArcSwap<Arc<AdState>>>,
    client: web::Data<PrismaClient>,
) -> impl Responder {
    load_ad_meta(data.clone(), client.clone()).await;

    HttpResponse::Ok().json(true)
}
#[post("/search")]
async fn search(
    data: web::Data<ArcSwap<Arc<AdState>>>,
    request: web::Json<Request>,
) -> impl Responder {
    let matched_ad_groups = data.load().search(
        &request.service_id,
        &request.placement_group_id,
        &request.user_info,
    );

    HttpResponse::Ok().json(matched_ad_groups)
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").unwrap();
    let ad_meta_sync_period_millis = env::var("AD_META_SYNC_PERIOD_MILLIS")
        .map(|s| s.parse::<u64>().unwrap_or(60000))
        .unwrap_or(60000);

    let prisma = Arc::new(db::new_client_with_url(&database_url).await.unwrap());
    let client = web::Data::from(prisma);

    let state = Arc::new(ArcSwap::new(Arc::new(Arc::new(AdState::default()))));
    let ad_state = web::Data::from(state);

    let rt = Builder::new_multi_thread()
        .worker_threads(1)
        .enable_all()
        .build()
        .unwrap();
    rt.spawn(load_ad_meta_periodic(
        ad_state.clone(),
        client.clone(),
        ad_meta_sync_period_millis,
    ));

    HttpServer::new(move || {
        let cors = Cors::permissive();
        let logger = Logger::default();

        App::new()
            .app_data(ad_state.clone())
            .app_data(client.clone())
            .service(search)
            .service(update_ad_meta)
            .wrap(cors)
            .wrap(logger)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
