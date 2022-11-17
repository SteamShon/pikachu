use actix_web::{
    post, HttpResponse, Responder, web::{self, Json}, HttpRequest,
};
use jsonschema::{JSONSchema, Draft};
use serde::{Deserialize, Serialize};
use serde_json::Value;
 #[derive(Debug, Serialize, Deserialize)]
struct MyRequest {
    schema: String,
    req_body: String
}
#[post("/schema/validate")]
pub async fn validate(request: web::Json<MyRequest>) -> impl Responder  {
    // println!("model: {:?}", &request);
    match serde_json::from_str(&request.schema) {
        Ok(json_schema) => 
            match JSONSchema::options().with_draft(Draft::Draft7).compile(&json_schema) {
                Ok(compiled) => 
                    match serde_json::from_str(&request.req_body) {
                        Ok(data) => {
                            let result = compiled.validate(&data);
                            if let Err(errors) = result {
                                for error in errors {
                                    println!("Validation error: {}", error);
                                    println!("Instance path: {}", error.instance_path);
                                }
                            }
                            
                            let is_valid = JSONSchema::is_valid(&compiled, &data);
                            println!("schema: {:?}", &compiled);
                            println!("data: {:?}", &data);
                            println!("is_valid: {:?}", &is_valid);

                            HttpResponse::Ok().body(is_valid.to_string())
                        }
                        Err(error) => 
                            HttpResponse::BadRequest().body(error.to_string())
                    }
                
                Err(error) => 
                    HttpResponse::BadRequest().body(error.to_string())
            }
        Err(error) => 
            HttpResponse::BadRequest().body(error.to_string())
    }
    
}