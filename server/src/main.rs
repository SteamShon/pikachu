pub mod ad_filter;
pub mod db;

use std::{
    collections::{HashMap, HashSet},
    env,
    sync::Arc,
};

use actix_web::{
    get, post,
    web::{self},
    App, HttpResponse, HttpServer, Responder,
};
use dotenv::dotenv;
use filter::filter::UserInfo;
use serde::Deserialize;
use serde_json::Value;

use crate::ad_filter::AdState;

#[derive(Deserialize)]
struct Request {
    service_id: String,
    placement_group_id: String,
    user_info: Value,
}
#[post("/")]
async fn hello(data: web::Data<AdState>, request: web::Json<Request>) -> impl Responder {
    let matched_ad_groups = data.search(
        &request.service_id,
        &request.placement_group_id,
        &request.user_info,
    );

    HttpResponse::Ok().json(matched_ad_groups)
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").unwrap();
    println!("DATABASE_URL: {}", database_url);
    let client = db::new_client_with_url(&database_url).await.unwrap();
    let ad_state = AdState::new(Arc::new(client)).await;
    let data = web::Data::new(ad_state);
    HttpServer::new(move || App::new().app_data(data.clone()).service(hello))
        .bind(("127.0.0.1", 8080))?
        .run()
        .await
}

//     let client = web::Data::new(db::new_client_with_url(&database_url).await.unwrap());
//     println!("Running");

//     HttpServer::new(move || {
//         let logger = Logger::default();

//         App::new()
//             // .app_data(client.clone())
//             .wrap(logger)
//             .service(hello)
//             .service(get_users)
//     })
//     .bind(("127.0.0.1", 8000))?
//     .run()
//     .await
// }
