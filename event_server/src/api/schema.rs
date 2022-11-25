use actix_web::web::Path;
use actix_web::{post, web, HttpResponse, get, patch};

use migration::sea_orm::{TryIntoModel};
use serde_json::{json};
use entity::schema::{Model as Schema};
use crate::{AppState, repo};


#[get("/subject/{subject_name}")]
pub async fn list(data: web::Data<AppState>, path: Path<String>) -> HttpResponse {
    let subject_name = path.as_str();
    
    match repo::subject::find_by_name_eager(&data.conn, subject_name).await {
        Ok(schemas) => HttpResponse::Ok().json(json!(schemas)),
        Err(error) => HttpResponse::InternalServerError().json(json!({
            "message": error.to_string(),
        }))
    }
}

#[post("/subject/{subject_name}/schema")]
pub async fn create(data: web::Data<AppState>, path: Path<String>, request: web::Json<Schema>) -> HttpResponse {
    let subject_name = path.as_str();
    let model: Schema = request.into_inner();
    let created = repo::schema::add_schema(&data.conn, subject_name, model).await;

    match created {
        Ok(active_model) => 
            HttpResponse::Ok().json(active_model.try_into_model().unwrap()),
        Err(error) => 
            HttpResponse::InternalServerError().json(json!({
                "message": error.to_string(),
            }))
    }
}


/*
#[patch("/subject/{subject_name}/schema/{schema_name}/{version}")]
pub async fn update(data: web::Data<AppState>, path: Path<String>, request: web::Json<Schema>) -> HttpResponse {
    let subject_name = path.as_str();
    let model: Schema = request.into_inner();
    
}
*/
