mod api;

use actix_web::web;
use api::publish::{publish};
use api::dataset::{list, create};
use actix_web::{HttpServer, App, middleware::Logger};
use migration::sea_orm::{Database, self};
use migration::{Migrator, MigratorTrait};
use rdkafka::config::ClientConfig;
use rdkafka::producer::FutureProducer;

pub struct AppState {
    pub conn: sea_orm::DatabaseConnection,
    pub producer: FutureProducer,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("debug"));
    

    let db_url = "sqlite://data.db";
    // env::var("DATABASE_URL").expect("DATABASE_URL is not set in .env file");
    println!("DATABASE_URL: #{:?}", db_url);
    let conn = Database::connect(db_url).await.unwrap();
    Migrator::up(&conn, None).await.unwrap();
    //let config = aws_config::load_from_env().await;
    
    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", "localhost:9092")
        .create()
        .expect("Producer creation error");

    HttpServer::new(move || {
        
        let logger = Logger::default();
        
        App::new()
            .app_data(web::Data::new(AppState { conn: conn.to_owned(), producer: producer.to_owned() }))    
            .wrap(logger)
            // dataset
            .service(list)
            .service(create)
            // publish
            .service(publish)
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}