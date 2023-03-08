pub mod ad_filter;
pub mod db;
use std::{
    collections::{HashMap, HashSet},
    env,
    sync::Arc,
    thread,
    time::Duration,
};
use tokio::sync::Mutex;

use actix_cors::Cors;
use actix_web::{
    middleware::Logger,
    post,
    web::{self},
    App, HttpResponse, HttpServer, Responder,
};
use db::PrismaClient;
use dotenv::dotenv;
use serde::Deserialize;
use serde_json::Value;

use crate::{ad_filter::AdState, db::placement_group};

#[derive(Deserialize)]
struct Request {
    service_id: String,
    placement_group_id: String,
    user_info: Value,
}
pub async fn long_running_task(data: web::Data<Mutex<AdState>>, client: web::Data<PrismaClient>) {
    loop {
        let mut ad_state = data.lock().await;
        ad_state.load(client.clone().into_inner()).await;

        tokio::time::sleep(Duration::from_secs(60)).await;
    }
}
#[post("/update_ad_meta")]
async fn update_ad_meta(
    data: web::Data<Mutex<AdState>>,
    client: web::Data<PrismaClient>,
    // request: web::Json<placement_group::Data>,
) -> impl Responder {
    let mut ad_state = data.lock().await;
    ad_state.load(client.into_inner()).await;

    HttpResponse::Ok().json(true)
}
#[post("/search")]
async fn search(data: web::Data<Mutex<AdState>>, request: web::Json<Request>) -> impl Responder {
    let matched_ad_groups = data.lock().await.search(
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

    let prisma = Arc::new(db::new_client_with_url(&database_url).await.unwrap());
    let client = web::Data::from(prisma);

    let state = Arc::new(Mutex::new(AdState::default()));
    let ad_state = web::Data::from(state);

    tokio::spawn(long_running_task(ad_state.clone(), client.clone()));

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
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
