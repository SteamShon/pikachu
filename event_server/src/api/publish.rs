
use actix_web::{
    post, HttpResponse, Responder, web, 
};
use jsonschema::{JSONSchema, Draft};
use serde::{Deserialize, Serialize};
use serde_json::Value;

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
pub async fn publish(request: web::Json<MyRequest>) -> impl Responder  {
    // let req_body = std::str::from_utf8(&request[..]);
    // println!("request: {:?}", &req_body);
    
    match serde_json::from_str(&request.schema) {
        Ok(json_schema) => 
            match JSONSchema::options().with_draft(Draft::Draft7).compile(&json_schema) {
                Ok(compiled_schema) => {
                    let validations: Vec<bool> = request
                    .events
                    .iter()
                    .map(|event| validate_each(&compiled_schema, &event).unwrap_or(false) )
                    .collect();

                    HttpResponse::Ok().json(validations)
                }
                Err(error) => HttpResponse::BadRequest().body(error.to_string())
            }
        Err(error) => HttpResponse::BadRequest().body(error.to_string())
    }
}