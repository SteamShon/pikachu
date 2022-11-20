use std::error;
use std::fmt;
use std::time::Duration;

use actix_web::{
    post, HttpResponse, Responder, web, 
};
use jsonschema::{JSONSchema, Draft};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::AppState;
use rdkafka::{producer::{FutureProducer, FutureRecord}};
use futures::future::join_all;

#[derive(Debug, Serialize)]
enum PublishError {
    SchemaNotMatched
}
impl error::Error for PublishError {}

impl fmt::Display for PublishError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            SchemaNotMatched => write!(f, "SchemaNotMatched"),
        }
    }
}

 #[derive(Debug, Serialize, Deserialize)]
pub struct MyRequest {
    schema: String,
    events: Vec<String>,
    skip_publish: Option<bool>,
}

impl Default for MyRequest {
    fn default() -> Self {
        MyRequest {
            schema: r#"{
                "type": "object",
                "title": "",
                "properties": {}
            }"#.to_string(),
            events: vec![],
            skip_publish: None,
        }
    }
}

fn validate_each(compiled_schema: &JSONSchema, event: &str) -> Result<bool, serde_json::Error> {
    let value: Result<Value, serde_json::Error> = serde_json::from_str(event);
    
    value.map(|v| {
            /* 
            println!("{:?}", v);
            println!("{:?}", compiled_schema);
            println!("{:?}", compiled_schema.is_valid(&v));
            
            let result = compiled_schema.validate(&v);
            if let Err(errors) = result {
                for error in errors {
                    println!("Validation error: {}", error);
                    println!("Instance path: {}", error.instance_path);
                }
            }
            */

            compiled_schema.is_valid(&v)
        }
    )
}

#[post("/publish")]
pub async fn publish(request: web::Json<MyRequest>, data: web::Data<AppState>) -> impl Responder  {
    // let req_body = std::str::from_utf8(&request[..]);
    // println!("request: {:?}", &req_body);
    
    match serde_json::from_str(&request.schema) {
        Ok(json_schema) => 
            match JSONSchema::options().with_draft(Draft::Draft7).compile(&json_schema) {
                Ok(compiled_schema) => {
                    let valid_events: Vec<Result<&String, serde_json::Error>> = request
                    .events
                    .iter()
                    .map(|event| match validate_each(&compiled_schema, &event) {
                        Ok(is_valid) => {
                            if is_valid {
                                Ok(event)
                            } else {
                                Err(serde::de::Error::invalid_length(
                                    0,
                                    &"fewer elements in array",
                                ))
                            }
                        },
                        Err(error) => Err(error)
                    } )
                    .collect();

                    let delivered = produce(&data.producer, "test", valid_events).await;
                    
                    HttpResponse::Ok().json(delivered)
                }
                Err(error) => HttpResponse::BadRequest().body(error.to_string())
            }
        Err(error) => HttpResponse::BadRequest().body(error.to_string())
    }
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