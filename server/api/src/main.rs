
use actix_cors::Cors;
use actix_web::{
    get,
    middleware::Logger,
    post,
    web::{self},
    App, HttpResponse, HttpServer, Responder,
};
use ad_state::{ad_state::{AdState, CreativeFeedback}, ad_state_builder::load};
use arc_swap::ArcSwap;
use common::db::{self, PrismaClient};
use dotenv::dotenv;
use serde::Deserialize;
use serde_json::Value;
use std::{collections::HashSet, env, sync::Arc, time::Duration};
use tokio::{runtime::Builder, time};

#[derive(Deserialize)]
struct UserFeatureRequest {
    placement_id: String,
    user_id: String,
}
#[derive(Deserialize)]
struct Request {
    service_id: String,
    placement_id: String,
    user_info: Value,
    top_k: Option<usize>
}
// copy prev shared state into new struct on heap. then atomically replace Arc using ArcSwap
async fn load_ad_meta(data: web::Data<ArcSwap<Arc<AdState>>>, client: web::Data<PrismaClient>) {
    let prev = data.load();
    let mut new_ad_state = AdState {
        ..prev.as_ref().as_ref().clone()
    };
    load(&mut new_ad_state, client.clone().into_inner()).await;
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
        &request.placement_id,
        &request.user_info,
        request.top_k,
    );

    HttpResponse::Ok().json(matched_ad_groups)
}

#[post("/user_info")]
async fn user_info(
    data: web::Data<ArcSwap<Arc<AdState>>>,
    client: web::Data<PrismaClient>,
    request: web::Json<UserFeatureRequest>,
) -> impl Responder {
    let user_info = data
        .load()
        .fetch_user_info(&request.placement_id, &request.user_id)
        .await;

    HttpResponse::Ok().json(user_info)
}

#[get("/all_dimensions/{placement_id}")]
async fn all_dimensions(
    data: web::Data<ArcSwap<Arc<AdState>>>,
    path: web::Path<String>,
) -> impl Responder {
    let placement_id = path.into_inner();

    match data.load().filter_index.get(&placement_id) {
        None => HttpResponse::NotFound().json(false),
        Some(filter_index) => {
            let dimensions: HashSet<String> = filter_index.all_dimensions.keys().cloned().collect();

            HttpResponse::Ok().json(dimensions)
        }
    }
}
#[post("/update_feedback")]
async fn update_feedback(
    data: web::Data<ArcSwap<Arc<AdState>>>,
    request: web::Json<Vec<CreativeFeedback>>,
) -> impl Responder {
    let prev = data.load();
    
    let mut new_ad_state = AdState {
        ..prev.as_ref().as_ref().clone()
    };
    new_ad_state.update_creative_feedback(&request.into_inner());

    data.store(Arc::new(Arc::new(new_ad_state)));
    HttpResponse::Ok().json(true)
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
            .service(user_info)
            .service(update_ad_meta)
            .service(all_dimensions)
            .service(update_feedback)
            .wrap(cors)
            .wrap(logger)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
