use actix_web::{
    get,
    post,
    web::{Json, self}, HttpResponse, 
};
use migration::{sea_orm::{self, EntityTrait, Set, ActiveModelTrait}, DbErr};
use entity::dataset::{Entity as Dataset, ActiveModel};
use entity::dataset::Model;
use entity::dataset;
use crate::AppState;

#[post("/dataset")]
pub async fn create(data: web::Data<AppState>, request: web::Json<Model>) -> HttpResponse {
    let m = request.into_inner();
    println!("Model: {:?}", m);

    let result = dataset::ActiveModel {
        name: Set(m.name),
        arn: Set(m.arn),
        data_format: Set(m.data_format),
        compatibility: Set(m.compatibility),
        schema: Set(m.schema),
        status: Set(m.status),
        ..Default::default()
    }
    .save(&data.conn)
    .await;

    match result {
        Ok(_created) => HttpResponse::Ok().json(true),
        
        Err(error) => HttpResponse::BadRequest().json(error.to_string())
    }
}

#[get("/dataset/list")]
pub async fn list(data: web::Data<AppState>) -> Json<Vec<Model>> {
    let datasets = 
        Dataset::find().all(&data.conn).await.unwrap_or(vec![]);

    return Json(datasets);
}