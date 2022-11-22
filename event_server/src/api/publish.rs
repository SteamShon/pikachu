use std::error;
use std::fmt;
use std::time::Duration;

use actix_web::web::Path;
use actix_web::{
    post, HttpResponse, Responder, web, 
};
use jsonschema::{JSONSchema, Draft, ValidationError};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use crate::AppState;
use crate::api::dataset::dataset_find_by_uuid;
use rdkafka::{producer::{FutureProducer, FutureRecord}};
use futures::future::join_all;


 #[derive(Debug, Serialize, Deserialize)]
pub struct MyRequest {
    schema_id: Uuid,
    skip_publish: Option<bool>,
}

impl Default for MyRequest {
    fn default() -> Self {
        MyRequest {
            schema_id: Uuid::new_v4(),
            skip_publish: None,
        }
    }
}

fn validate_each(compiled_schema: &JSONSchema, event: &str) -> Result<bool, serde_json::Error> {
    let value: Result<Value, serde_json::Error> = serde_json::from_str(event);
    
    value.map(|v| {
            compiled_schema.is_valid(&v)
        }
    )
}

async fn produce(
    producer: &FutureProducer, 
    topic_name: &str, 
    valid_events: Vec<Result<&String, serde_json::Error>>
) -> Vec<bool> {
    
    let futures = valid_events
        .iter()
        .map(|valid_event| async move {
            match valid_event {
                Ok(event) => {
                    let record = FutureRecord::to(topic_name)
                        .key("")
                        .payload(event.as_str());

                    producer
                        .send(
                            record,
                            Duration::from_secs(0),
                        )
                    .await
                    .map(|_delivery_result| true)
                    .unwrap_or(false)
                },
                Err(_error) => false
            }
        })
        .collect::<Vec<_>>();

    join_all(futures).await
}

#[post("/publish/{schema_id}/{skip_publish}")]
pub async fn publish(path: Path<MyRequest>, events: web::Json<Vec<String>>, data: web::Data<AppState>) -> impl Responder  {
    let fetched_dataset_result = dataset_find_by_uuid(&data.conn, path.schema_id).await;
    if let Err(error) = fetched_dataset_result {
        return HttpResponse::InternalServerError().body(error.to_string())
    }
    
    let dataset_option = fetched_dataset_result.unwrap();
    if let None = dataset_option {
        return HttpResponse::NotFound().body(format!("dataset is not found: uuid=[#{}]", path.schema_id))
    }

    let dataset = dataset_option.unwrap();
    let json_schema_result: Result<Value, serde_json::Error> = serde_json::from_str(&dataset.schema);
    if let Err(error) = json_schema_result {
        return HttpResponse::BadRequest().body(error.to_string())
    }

    let json_schema = json_schema_result.unwrap();
    let compiled_schema_result = JSONSchema::options().with_draft(Draft::Draft7).compile(&json_schema);
    if let Err(error) = compiled_schema_result {
        return HttpResponse::BadRequest().body(error.to_string())
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
            },
            Err(error) => Err(error)
        } )
        .collect();

    let delivered = produce(&data.producer, "quickstart-events", valid_events).await;
        
    HttpResponse::Ok().json(delivered)
}