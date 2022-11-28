use std::time::Duration;

use crate::{AppState, repo};
use repo::types::{Schema as MySchema, Error as MyError};
use actix_web::web::Path;
use actix_web::{post, web, HttpResponse, Responder};
use futures::future::join_all;
use jsonschema::{Draft, JSONSchema};
use rdkafka::producer::{FutureProducer, FutureRecord};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

#[derive(Debug, Serialize, Deserialize)]
pub struct MyRequest {
    subject_name: String,
    version: Option<String>,
}

fn validate_each(compiled_schema: &JSONSchema, event: &str) -> Result<bool, serde_json::Error> {
    let value: Result<Value, serde_json::Error> = serde_json::from_str(event);

    value.map(|v| compiled_schema.is_valid(&v))
}


#[post("/publish/{subject_name}")]
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
    
    let (subject, schema) = (subject_option.unwrap(), schema_option.unwrap());
    let topic_name = subject.topic_name.unwrap_or(subject.name);

    let valid_events_result = 
        repo::schema::validate_events(&schema, events.into_inner());

    if let Err(error) = valid_events_result {
        return HttpResponse::InternalServerError().json(json!(error))
    }

    let valid_events = valid_events_result.unwrap();
    let produced_result =
        produce(&data.producer, &topic_name, valid_events).await;

    if let Err(_error) = produced_result {
        return HttpResponse::InternalServerError().body("error")
    }
    let ls: Vec<bool> = 
        produced_result
            .unwrap()
            .iter()
            .map(|r| r.to_owned().unwrap_or(false))
            .collect();

    HttpResponse::Ok().json(json!(ls))
}

pub async fn produce(
    producer: &FutureProducer, 
    topic_name: &str, 
    payloads: Vec<Result<Vec<u8>, MyError>>) -> Result<Vec<Result<bool, MyError>>, MyError> {
    
    let futures = payloads
        .into_iter()
        .map(|payload_result| async move {
            payload_result.map(|payload| {
                /* 
                    let record = 
                        FutureRecord::to(topic_name).key("").payload(payload);

                    let produced_result = producer
                        .send(record, Duration::from_secs(0))
                        .await;

                    match produced_result {
                        Ok(produced) => Ok(true),
                        Err((error, message)) => Err(SchemaParseError::PublishError)
                    }
                    */
                println!("payload: {:?}", payload);
                true
            })
        })
        .collect::<Vec<_>>();

    let result = join_all(futures).await;

    Ok(result)
}
