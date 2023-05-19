pub mod meta;
pub mod processor;
pub mod publisher;
pub mod util;

use std::{env, sync::Arc};

use actix_cors::Cors;
use actix_web::{
    middleware::Logger,
    post,
    web::{self, Bytes, Json},
    App, HttpResponse, HttpServer, Responder,
};
use common::db;
use dotenv::dotenv;
use futures::future::join_all;
use processor::Processor;
use publisher::Publisher;
use serde_json::json;
use tokio::runtime::Builder;

use crate::publisher::Event;

#[post("/publishes/{topic}/{service_id}")]
async fn publishes<'a>(
    data: web::Data<Publisher<'a>>,
    events: Json<Vec<Event>>,
    path: web::Path<(String, String)>,
) -> impl Responder {
    let (topic, _service_id) = path.into_inner();
    // let topic = data.get_topic(service_id.as_str());
    // if let None = topic {
    //     return HttpResponse::BadRequest().json(false)
    // }

    let futures: Vec<_> = events
        .iter()
        .map(|event| data.publish(topic.as_str(), event))
        .collect();
    let send_results = join_all(futures).await;

    let mut error_exist = false;
    let results: Vec<_> = send_results
        .iter()
        .map(|result| match result {
            Ok((partition, offset)) => json!({
                "partition": partition,
                "offset": offset,
            }),
            Err(error) => {
                error_exist = true;
                json!({ "error": format!("{:?}", error) })
            }
        })
        .collect();
    if error_exist {
        HttpResponse::InternalServerError().json(results)
    } else {
        HttpResponse::Ok().json(results)
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    dotenv().ok();

    let envs: std::collections::HashMap<String, String> = util::parse_envs(env::vars().into_iter());
    let schema_registry_settings = util::parse_schema_registry_settings(&envs);
    let kafka_configs = util::parse_kafka_config(&envs);

    let publisher = Publisher::new(schema_registry_settings, &kafka_configs);
    let data = web::Data::new(publisher);

    let database_url = envs.get("DATABASE_URL").unwrap();
    let client = Arc::new(db::new_client_with_url(&database_url).await.unwrap());
    let default_group_id = "event-server".to_string();
    let group_id = envs.get("GROUP_ID").unwrap_or(&default_group_id);
    let topic: &str = "events";
    let rt = Builder::new_multi_thread()
        .worker_threads(1)
        .enable_all()
        .build()
        .unwrap();
    println!("{:?}", database_url);
    Processor::new(&rt, client, group_id, topic, &kafka_configs);

    HttpServer::new(move || {
        let cors = Cors::permissive();
        let logger = Logger::default();

        App::new()
            .app_data(data.clone())
            .service(publishes)
            .wrap(cors)
            .wrap(logger)
    })
    .bind(("0.0.0.0", 8181))?
    .run()
    .await
}
