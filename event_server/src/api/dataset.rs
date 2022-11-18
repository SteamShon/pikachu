use actix_web::{
    get,
    post,
    web::{Json, self}, 
};
use migration::{sea_orm::{self, EntityTrait, Set, ActiveModelTrait}, DbErr};
use entity::dataset::{Entity as Dataset, ActiveModel};
use entity::dataset::Model;
use entity::dataset;

#[derive(Debug)]
pub struct AppState {
    pub conn: sea_orm::DatabaseConnection,
}

#[post("/dataset")]
pub async fn create(data: web::Data<AppState>, request: web::Json<Model>) -> Json<bool> {
    let result = dataset::ActiveModel {
        name: Set(request.into_inner().name),
        ..Default::default()
    }
    .save(&data.conn)
    .await
    .map(|_m| true).unwrap_or(false);

    return Json(result)
}

#[get("/dataset/list")]
pub async fn list(data: web::Data<AppState>) -> Json<Vec<Model>> {
    let datasets = 
        Dataset::find().all(&data.conn).await.unwrap_or(vec![]);

    return Json(datasets);
}