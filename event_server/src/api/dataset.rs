use actix_web::{
    get,
    post,
    web::{Json, self}, HttpResponse, error::InternalError, 
};

use uuid::Uuid;
use migration::{sea_orm::{self, EntityTrait, Set, ActiveModelTrait, QueryFilter, ColumnTrait, QueryTrait}, DbErr};
use entity::dataset::{Entity as Dataset, ActiveModel};
use entity::dataset::Model;
use entity::dataset;
use crate::AppState;
use cached::proc_macro::once;

#[once(result = true, time = 1)]
pub async fn dataset_find_by_uuid(
    db: &sea_orm::DatabaseConnection,  
    uuid: Uuid) -> Result<Option<Model>, DbErr> {
    Dataset::find().filter(dataset::Column::Uuid.eq(uuid)).one(db).await
    /*
        if cache.contains_key(&uuid) {
        Ok(cache.get(&uuid).unwrap())
    } else {
        let dataset = Dataset::find().filter(dataset::Column::Uuid.eq(uuid)).one(db).await;
        
        if dataset.is_ok() {
            cache.insert(uuid, dataset.unwrap());

            Ok(cache.get(&uuid).unwrap())
        } else {
            dataset
        }
    }
     */   
}

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
        uuid: Set(Uuid::new_v4()),
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
pub async fn list(data: web::Data<AppState>) -> HttpResponse {
    match Dataset::find().all(&data.conn).await {
        Ok(datasets) => HttpResponse::Ok().json(Json(datasets)),
        Err(db_error) => HttpResponse::InternalServerError().body(db_error.to_string())
    }
    
}

#[get("dataset/{uuid}")]
pub async fn find_by_uuid(path: web::Path<Uuid>, data: web::Data<AppState>) -> HttpResponse {
    let uuid = path.into_inner();
    let fetched = dataset_find_by_uuid(&data.conn, uuid).await;
    match fetched {
        Ok(dataset_option) => 
            dataset_option.map(|ds| HttpResponse::Ok().json(Json(ds)))
            .unwrap_or(HttpResponse::NotFound().body(uuid.to_string()))
        ,
        Err(db_error) => HttpResponse::InternalServerError().body(db_error.to_string())
    } 
}