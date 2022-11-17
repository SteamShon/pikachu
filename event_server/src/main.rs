mod api;
use api::publish::{validate};
use api::dataset::{get_dataset};
use actix_web::{HttpServer, App, middleware::Logger};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "debug");
    std::env::set_var("RUST_LOG", "1");
    std::env::set_var("RUST_BACKTRACE", "1");
    env_logger::init();

    //let config = aws_config::load_from_env().await;
    HttpServer::new(move || {
        
        let logger = Logger::default();
        App::new()
            .wrap(logger)
            .service(get_dataset)
            .service(validate)
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}