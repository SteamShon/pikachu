mod db;

use actix_web::{
    get,
    middleware::Logger,
    post,
    web::{self, service},
    App, HttpResponse, HttpServer, Responder,
};
use db::{service, PrismaClient};
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use std::env;

// #[get("/users")]
// async fn get_users(client: web::Data<PrismaClient>) -> impl Responder {
//     let users = client.user().find_many(vec![]).exec().await.unwrap();

//     HttpResponse::Ok().json(users)
// }

#[get("/")]
async fn hello(client: web::Data<PrismaClient>) -> impl Responder {
    let services = client
        .service()
        .find_first(vec![])
        .include(db::service::include!(
            {
                placement_groups: include {
                    placements: include {
                        campaigns: include {
                            ad_groups: include {
                                creatives
                            }
                        }
                    }
                }
            }
        ))
        .exec()
        .await
        .unwrap();

    HttpResponse::Ok().json(services)
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").unwrap();
    println!("DATABASE_URL: {}", database_url);
    let client = web::Data::new(db::new_client_with_url(&database_url).await.unwrap());
    HttpServer::new(move || App::new().app_data(client.clone()).service(hello))
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
