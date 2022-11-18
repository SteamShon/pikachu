use actix_web::{
    get,
    web::{Json, self}
};
use migration::{sea_orm::{self, EntityTrait}};
use entity::dataset::Entity as Dataset;
use entity::dataset::Model;

#[derive(Debug)]
pub struct AppState {
    pub conn: sea_orm::DatabaseConnection,
}

#[get("/dataset/list")]
pub async fn list(data: web::Data<AppState>) -> Json<Vec<Model>> {
    let db = &data.conn;
    let datasets = 
        Dataset::find().all(db).await.unwrap_or(vec![]);

    return Json(datasets);
}