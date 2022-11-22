mod api;

use std::time::Duration;

use actix_web::web;
use api::publish::{publish};
use api::dataset::{list, create};
use actix_web::{HttpServer, App, middleware::Logger};
use entity::dataset;
use migration::sea_orm::{Database, self};
use migration::{Migrator, MigratorTrait};
use rdkafka::config::ClientConfig;
use rdkafka::producer::FutureProducer;
use mini_moka::sync::Cache;
use uuid::Uuid;

use crate::api::dataset::find_by_uuid;

pub struct AppState {
    pub conn: sea_orm::DatabaseConnection,
    pub producer: FutureProducer,
    pub cache: Cache<Uuid, Option<dataset::Model>>,
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

    let cache: Cache<Uuid, Option<dataset::Model>> = Cache::builder()
        // Time to live (TTL): 30 minutes
        .time_to_live(Duration::from_secs(30 * 60))
        // Time to idle (TTI):  5 minutes
        .time_to_idle(Duration::from_secs( 5 * 60))
        // Create the cache.
        .build();
    HttpServer::new(move || {
        
        let logger = Logger::default();
        
        App::new()
            .app_data(web::Data::new(AppState { 
                conn: conn.to_owned(), 
                producer: producer.to_owned(),
                cache: cache.to_owned(),
            }))    
            .wrap(logger)
            // dataset
            .service(list)
            .service(create)
            .service(find_by_uuid)
            // publish
            .service(publish)
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}