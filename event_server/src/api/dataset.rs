use actix_web::{
    get,
    web::Json
};

#[get("/dataset/{dataset_id}")]
pub async fn get_dataset() -> Json<String> {
    return Json("hello world".to_string());
}