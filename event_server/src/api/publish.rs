use std::time::Duration;

use crate::{AppState, repo};
use actix_web::web::Path;
use actix_web::{post, web, HttpResponse, Responder};
use futures::future::join_all;
use jsonschema::{Draft, JSONSchema};
use rdkafka::producer::{FutureProducer, FutureRecord};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct MyRequest {
    subject_name: String,
    version: Option<String>,
}

fn validate_each(compiled_schema: &JSONSchema, event: &str) -> Result<bool, serde_json::Error> {
    let value: Result<Value, serde_json::Error> = serde_json::from_str(event);

    value.map(|v| compiled_schema.is_valid(&v))
}

async fn produce(
    producer: &FutureProducer,
    topic_name: &str,
    valid_events: Vec<Result<&String, serde_json::Error>>,
) -> Vec<bool> {
    let futures = valid_events
        .iter()
        .map(|valid_event| async move {
            match valid_event {
                Ok(event) => {
                    let record = FutureRecord::to(topic_name).key("").payload(event.as_str());

                    producer
                        .send(record, Duration::from_secs(0))
                        .await
                        .map(|_delivery_result| true)
                        .unwrap_or(false)
                }
                Err(_error) => false,
            }
        })
        .collect::<Vec<_>>();

    join_all(futures).await
}

#[post("/publish/{schema_name}/{version}")]
pub async fn publish(
    path: Path<MyRequest>,
    events: web::Json<Vec<String>>,
    data: web::Data<AppState>,
) -> impl Responder {
    let subject_with_schema = match &path.version {
        Some(version) => repo::schema::find_by_version(&data.conn, &path.subject_name, &version).await,
        None => repo::schema::find_by_latest_version(&data.conn, &path.subject_name).await,
    };
    
    if let Err(error) = subject_with_schema {
        return HttpResponse::InternalServerError().body(error.to_string());
    }

    let (subject_option, schema_option) = subject_with_schema.unwrap();

    if let None = subject_option {
        return HttpResponse::NotFound()
            .body(format!("subject=[{}] has now valid schema.", path.subject_name))
    };

    if let None = schema_option {
         return HttpResponse::NotFound()
            .body(format!("subject=[{}] found, but schema not found.", path.subject_name))
    };
    
    let (_, schema) = (subject_option.unwrap(), schema_option.unwrap());

    let json_schema_result: Result<Value, serde_json::Error> =
        serde_json::from_str(&schema.schema);
    if let Err(error) = json_schema_result {
        return HttpResponse::BadRequest().body(error.to_string());
    }

    let json_schema = json_schema_result.unwrap();
    let compiled_schema_result = JSONSchema::options()
        .with_draft(Draft::Draft7)
        .compile(&json_schema);
    if let Err(error) = compiled_schema_result {
        return HttpResponse::BadRequest().body(error.to_string());
    }

    let compiled_schema = compiled_schema_result.unwrap();

    let valid_events: Vec<Result<&String, serde_json::Error>> = events
        .iter()
        .map(|event| match validate_each(&compiled_schema, &event) {
            Ok(is_valid) => {
                if is_valid {
                    Ok(event)
                } else {
                    //TODO: data is not matched to schema. so SchemaNotMatched Error should be returned.
                    Err(serde::de::Error::invalid_length(
                        0,
                        &"fewer elements in array",
                    ))
                }
            }
            Err(error) => Err(error),
        })
        .collect();

    let delivered = produce(&data.producer, "quickstart-events", valid_events).await;

    HttpResponse::Ok().json(delivered)
}
