use std::{env, sync::Arc};

use actix_web::{
    get, post,
    web::{self},
    App, HttpResponse, HttpServer, Responder,
};
use dotenv::dotenv;
use filter::ad_meta::{AdMeta, Context};
use serde::Deserialize;

#[derive(Deserialize)]
struct Request {
    service_id: String,
    placement_group_id: String,
    user_info: serde_json::Value,
}

#[post("/")]
async fn hello(data: web::Data<AdMeta>, request: web::Json<Request>) -> impl Responder {
    let filtered = data.filter_ad_meta(
        &request.service_id,
        &request.placement_group_id,
        &request.user_info,
    );

    HttpResponse::Ok().json(filtered)
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").unwrap();
    println!("DATABASE_URL: {}", database_url);
    let client = filter::db::new_client_with_url(&database_url)
        .await
        .unwrap();
    let ad_meta = AdMeta::new();

    let context = Context {
        client: Arc::new(client),
    };
    ad_meta.load(context).await;

    let data = web::Data::new(ad_meta);
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
