use actix_web::web::Path;
use actix_web::{post, web, HttpResponse, get, patch};

use migration::sea_orm::{TryIntoModel};
use serde_json::{json};
use entity::subject::{Model as Subject};
use crate::{AppState, repo};


#[get("/subject")]
pub async fn list(data: web::Data<AppState>) -> HttpResponse {
    let subjects = repo::subject::find_all(&data.conn).await;

    match subjects {
        Ok(ls) =>  HttpResponse::Ok().json(json!(ls)),
        Err(error) => HttpResponse::InternalServerError().json(json!({
            "message": error.to_string(),
        }))
    }
   
}

#[post("/subject")]
pub async fn create(data: web::Data<AppState>, request: web::Json<Subject>) -> HttpResponse {
    let model: Subject = request.into_inner();
    let created = repo::subject::create(&data.conn, model).await;

    match created {
        Ok(active_model) => 
            HttpResponse::Ok().json(active_model.try_into_model().unwrap()),
        Err(error) => 
            HttpResponse::InternalServerError().json(json!({
                "message": error.to_string(),
            }))
    }
}

#[patch("/subject/{subject_name}")]
pub async fn update(data: web::Data<AppState>, path: Path<String>, request: String) -> HttpResponse {
    let subject_name = path.as_str();
    let request_json = serde_json::from_str(&request);
    if let Err(error) = request_json {
        return HttpResponse::BadRequest().json(json!({
            "message": error.to_string(),
        }))
    }

    let updated = repo::subject::update(&data.conn, subject_name, request_json.unwrap()).await;
    match updated {
        Ok(active_model) => 
            HttpResponse::Ok().json(active_model.try_into_model().unwrap()),
        Err(error) => 
            HttpResponse::InternalServerError().json(json!({
                "message": error.to_string(),
            }))
    }
}
