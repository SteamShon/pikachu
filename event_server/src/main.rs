mod api;
use api::publish::{publish};
use api::dataset::{get_dataset};
use actix_web::{HttpServer, App, middleware::Logger};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    //let config = aws_config::load_from_env().await;
    
    HttpServer::new(move || {
        
        let logger = Logger::default();
        
        App::new()
            .wrap(logger)
            .service(get_dataset)
            .service(publish)
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}