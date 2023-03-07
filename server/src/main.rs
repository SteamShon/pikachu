pub mod ad_filter;
pub mod db;

use std::{
    collections::{HashMap, HashSet},
    env,
    sync::{Arc, Mutex},
};

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
#[post("/update_placement_groups")]
async fn update_placement_groups(
    data: web::Data<Mutex<AdState>>,
    client: web::Data<PrismaClient>,
    // request: web::Json<placement_group::Data>,
) -> impl Responder {
    let mut ad_state = data.lock().unwrap();
    ad_state
        .fetch_and_update_placement_groups(client.into_inner(), None)
        .await;

    HttpResponse::Ok().json(true)
}
#[post("/search")]
async fn search(data: web::Data<Mutex<AdState>>, request: web::Json<Request>) -> impl Responder {
    let matched_ad_groups = data.lock().unwrap().search(
        &request.service_id,
        &request.placement_group_id,
        &request.user_info,
    );

    HttpResponse::Ok().json(matched_ad_groups)
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").unwrap();
    let prisma = db::new_client_with_url(&database_url).await.unwrap();
    let client = web::Data::new(prisma);
    let ad_state = web::Data::new(Mutex::new(AdState::init()));

    HttpServer::new(move || {
        let cors = Cors::default();
        let logger = Logger::default();

        App::new()
            .app_data(ad_state.clone())
            .app_data(client.clone())
            .service(search)
            .service(update_placement_groups)
            .wrap(cors)
            .wrap(logger)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
