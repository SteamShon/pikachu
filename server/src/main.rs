
mod db;
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder, middleware::Logger};
use serde::{Serialize, Deserialize};
use db::{service, PrismaClient};

#[get("/users")]
async fn get_users(client: web::Data<PrismaClient>) -> impl Responder {
    let users = client.user().find_many(vec![]).exec().await.unwrap();

    HttpResponse::Ok().json(users)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let client = web::Data::new(db::new_client().await.unwrap());

    HttpServer::new(move || {
        let logger = Logger::default();

        App::new()
            .app_data(client.clone())
            .wrap(logger)
            // subject 
            .service(get_users)
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}