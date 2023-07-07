pub mod handler;
pub mod message_send_processor;
pub mod meta;
pub mod processor;
pub mod publisher;
pub mod stat_processor;
pub mod util;

use std::{collections::HashMap, env, sync::Arc};

use actix_cors::Cors;
use actix_web::{
    middleware::Logger,
    post,
    web::{self, Json},
    App, HttpResponse, HttpServer, Responder,
};
use common::db;
use dotenv::dotenv;
use futures::future::join_all;

use publisher::Publisher;
use serde::Deserialize;
use serde_json::json;
use tokio::runtime::Builder;

use crate::{
    handler::{initialize_message_send_processor_runner, initialize_stat_processor_runner},
    publisher::Event,
};
use duckdb::{Connection, Result};

#[derive(Deserialize, Debug)]
struct DuckDBStatement {
    statement: String,
}
#[derive(Deserialize, Debug)]
struct DuckDBQuery {
    statement: String,
    query: String,
}

async fn duckdb_query_sink_to_kafka_inner<'a>(
    data: web::Data<Publisher<'a>>,
    request: web::Json<DuckDBQuery>,
    topic: &str,
    which_publish_counts: &mut HashMap<String, i32>,
) -> Result<(), duckdb::Error> {
    let conn = Connection::open_in_memory()?;
    let stmt = &request.statement;
    conn.execute_batch(stmt)?;

    let query = &request.query;
    let mut stmt = conn.prepare(query)?;

    let events = stmt.query_map([], |row| {
        //TODO: Chagne this to get value from row directly once
        // duckdb-rs support Struct Type.
        let placement_id: String = row.get("placement_id")?;
        let from: String = row.get("from_column")?;
        let text: String = row.get("message")?;
        let props = Some(json!({
            "placement_id": placement_id,
            "from": from,
            "text": text
        }));

        Ok(Event {
            when: row.get("when")?,
            who: row.get("who")?,
            what: row.get("what")?,
            which: row.get("which")?,
            props,
        })
    })?;

    for event in events {
        if let Ok(e) = event {
            // println!("Event: {:?}", e);
            if let Ok(_) = data.publish(topic, &e).await {
                *which_publish_counts.entry(e.which).or_insert_with(|| 0) += 1;
            }
        }
    }

    Ok(())
}
#[post("/duckdb/query_sink_to_kafka")]
async fn duckdb_query_sink_to_kafka<'a>(
    data: web::Data<Publisher<'a>>,
    request: web::Json<DuckDBQuery>,
) -> impl Responder {
    let which_publish_counts = &mut HashMap::new();
    match duckdb_query_sink_to_kafka_inner(data, request, "sms", which_publish_counts).await {
        Ok(_) => HttpResponse::Ok().json(json!({
            "statusText": "success",
            "counts": which_publish_counts
        })),
        Err(e) => HttpResponse::InternalServerError().json(json!({
            "statusText": "error",
            "counts": which_publish_counts,
            "error": format!("{:?}", e)
        })),
    }
}
#[post("/duckdb/execute_batch")]
async fn duckdb_execute_batch(request: web::Json<DuckDBStatement>) -> impl Responder {
    let conn = Connection::open_in_memory().expect("connection");
    let stmt = &request.statement;
    match conn.execute_batch(stmt.as_str()) {
        Ok(_) => HttpResponse::Ok().json(json!({
            "statusText": "success"
        })),
        Err(e) => HttpResponse::InternalServerError().json(json!({
            "statusText": "error",
            "error": format!("{:?}", e)
        })),
    }
}

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
    initialize_stat_processor_runner(&rt, &kafka_configs, topic, &group_id, client.clone());
    initialize_message_send_processor_runner(&rt, &kafka_configs, "sms", &group_id, client.clone())
        .await;
    // Processor::new(&rt, client, group_id, topic, &kafka_configs);

    HttpServer::new(move || {
        let cors = Cors::permissive();
        let logger = Logger::default();

        App::new()
            .app_data(data.clone())
            .service(publishes)
            .service(duckdb_execute_batch)
            .service(duckdb_query_sink_to_kafka)
            .wrap(cors)
            .wrap(logger)
    })
    .bind(("0.0.0.0", 8181))?
    .run()
    .await
}
