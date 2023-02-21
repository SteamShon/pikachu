use std::{env, sync::Arc};

use actix_web::{
    get, post,
    web::{self},
    App, HttpResponse, HttpServer, Responder,
};
use dotenv::dotenv;
use filter::db::ad_group;
use filter::filter::filter_ad_meta;
use filter::filter::Context;
use filter::filter::LocalCachedAdMeta;

#[post("/")]
async fn hello(data: web::Data<LocalCachedAdMeta>, body: web::Bytes) -> impl Responder {
    let user_info: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let mut ad_groups = Vec::<&ad_group::Data>::new();
    filter_ad_meta(data.as_ref(), user_info, &mut ad_groups);

    HttpResponse::Ok().json(ad_groups)
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").unwrap();
    println!("DATABASE_URL: {}", database_url);
    let client = filter::db::new_client_with_url(&database_url)
        .await
        .unwrap();
    let context = Context {
        client: Arc::new(client),
    };
    let ad_meta = web::Data::new(LocalCachedAdMeta::load(context).await);
    HttpServer::new(move || App::new().app_data(ad_meta.clone()).service(hello))
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
