pub mod meta;
pub mod publisher;
pub mod util;

use actix_cors::Cors;
use actix_web::{
    middleware::Logger,
    post,
    web::{self, Bytes},
    App, HttpResponse, HttpServer, Responder,
};
use dotenv::dotenv;
use publisher::Publisher;
use serde_json::json;
use std::env;

#[post("/publish/{topic}/{service_id}")]
async fn publish<'a>(
    data: web::Data<Publisher<'a>>,
    body: Bytes,
    path: web::Path<(String, String)>,
) -> impl Responder {
    let (topic, _service_id) = path.into_inner();
    // let topic = data.get_topic(service_id.as_str());
    // if let None = topic {
    //     return HttpResponse::BadRequest().json(false)
    // }
    let result = data.publish(topic.as_str(), &body).await;

    //TODO:
    match result {
        Ok((partition, offset)) => HttpResponse::Ok().json(json!({
            "partition": partition,
            "offset": offset,
        })),
        Err(error) => HttpResponse::InternalServerError().json(json!({
            "error": format!("{:?}", error),
        })),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    dotenv().ok();

    let envs = util::parse_envs(env::vars().into_iter());
    let schema_registry_settings = util::parse_schema_registry_settings(&envs);
    let kafka_configs = util::parse_kafka_config(&envs);

    let publisher = Publisher::new(schema_registry_settings, kafka_configs);
    let data = web::Data::new(publisher);

    HttpServer::new(move || {
        let cors = Cors::permissive();
        let logger = Logger::default();

        App::new()
            .app_data(data.clone())
            .service(publish)
            .wrap(cors)
            .wrap(logger)
    })
    .bind(("0.0.0.0", 8181))?
    .run()
    .await
}
