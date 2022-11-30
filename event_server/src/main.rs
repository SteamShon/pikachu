mod api;
mod repo;

use std::env;

use actix_web::web;
use actix_web::{middleware::Logger, App, HttpServer};
use api::publish::publish;
use migration::sea_orm::{self, Database};
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

    let db_url = 
        env::var("DATABASE_URL").unwrap_or("sqlite://data.db".to_owned());
    
    println!("DATABASE_URL: #{:?}", db_url);
    let conn = Database::connect(db_url).await.unwrap();
    Migrator::up(&conn, None).await.unwrap();
    //let config = aws_config::load_from_env().await;
    let bootstrap_servers = 
        env::var("BOOTSTRAP_SERVERS").unwrap_or("localhost:9092".to_owned());

    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", bootstrap_servers)
        .create()
        .expect("Producer creation error");
    
    HttpServer::new(move || {
        let logger = Logger::default();

        App::new()
            .app_data(web::Data::new(AppState {
                conn: conn.to_owned(),
                producer: producer.to_owned(),
            }))
            .wrap(logger)
            // subject 
            .service(api::subject::list)
            .service(api::subject::create)
            .service(api::subject::update)
            // schema
            .service(api::schema::list)
            .service(api::schema::create)
            .service(api::schema::update)
            // publish
            .service(publish)
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}
