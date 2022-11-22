use std::collections::HashMap;

use actix_web::{
    get, post,
    web,
    HttpResponse, patch,
};
use migration::sea_orm::{IntoActiveModel, ActiveValue};

use crate::AppState;
use cached::proc_macro::once;
use entity::dataset::{self, ActiveModel};
use entity::dataset::Model;
use entity::dataset::{Entity as Dataset};
use jsonschema::{Draft, JSONSchema};
use migration::{
    sea_orm::{
        self, ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, 
        Set, TryIntoModel,
    },
    DbErr,
};
use serde_json::{Value, json};
use uuid::Uuid;
use json_value_merge::Merge;

pub fn compile_into_json_schema(schema: &str) -> Option<JSONSchema> {
    let json_schema_result: Result<Value, serde_json::Error> = serde_json::from_str(schema);

    if let Err(_error) = json_schema_result {
        return None;
    }

    let json_schema = json_schema_result.unwrap();
    let compiled_schema_result = JSONSchema::options()
        .with_draft(Draft::Draft7)
        .compile(&json_schema);
    compiled_schema_result.ok()
}

#[once(result = true, time = 10)]
pub async fn dataset_find_by_uuid(
    db: &sea_orm::DatabaseConnection,
    uuid: Uuid,
) -> Result<Option<Model>, DbErr> {
    Dataset::find()
        .filter(dataset::Column::Uuid.eq(uuid))
        .one(db)
        .await
}

#[post("/dataset")]
pub async fn create(data: web::Data<AppState>, request: web::Json<Model>) -> HttpResponse {
    let m = request.into_inner();
    let compiled_schema_option = compile_into_json_schema(&m.schema);

    if let None = compiled_schema_option {
        return HttpResponse::BadRequest()
            .body(format!("{:?} is not valid json schema.", &m.schema));
    }

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

    if let Err(error) = result {
        return HttpResponse::BadRequest().json(error.to_string());
    }

    let created = result.unwrap().try_into_model().unwrap();
    HttpResponse::Ok().json(created)
}

#[patch("/dataset/{uuid}")]
pub async fn update(data: web::Data<AppState>, path: web::Path<Uuid>, request: String) -> HttpResponse {    
    //TODO: add fn (new_schema: JSONSchema, prev_schemas: Vec<JsonSchema>, compatibility: String) -> bool
    let uuid = path.into_inner();
    let fetched = dataset_find_by_uuid(&data.conn, uuid).await;
    
    let request_json_result = serde_json::from_str(&request);
    if let Err(error) = request_json_result {
        return HttpResponse::BadRequest().body(error.to_string())
    }
    let request_json: Value = request_json_result.unwrap();

    // TODO: need to some way to merge request with already existing model then call update on it.
    if let Err(error) = fetched {
        return HttpResponse::InternalServerError().body(format!("dataset find failed: {:?}", error.to_string()))
    }

    let dataset_option = fetched.unwrap();

    if let None = dataset_option {
        return HttpResponse::NotFound().body(format!("dataset is not found: uuid=[{:?}]", uuid))
    }

    let model = dataset_option.unwrap();

    let mut dataset_json = json!(model);
    dataset_json.merge(request_json);
    
    let merged = dataset_json.clone();

    let mut dataset = model.into_active_model();
    
    if let Err(error) = dataset.set_from_json(merged) {
        return HttpResponse::InternalServerError().body(format!("set_from_json is failed: {:?}", error))
    }
    
    dataset.uuid = ActiveValue::unchanged(dataset.uuid.unwrap());
    
    let mutated = dataset.update(&data.conn).await;

    if let Err(error) = mutated {
        return HttpResponse::InternalServerError().body(format!("mutation failed: {:?}", error.to_string()))
    }
    HttpResponse::Ok().json(mutated.unwrap())
}

#[get("/dataset/list")]
pub async fn list(data: web::Data<AppState>) -> HttpResponse {
    let fetched = Dataset::find().all(&data.conn).await;
    if let Err(error) = fetched {
        return HttpResponse::InternalServerError().body(error.to_string());
    }
    let datasets = fetched.unwrap_or(vec![]);

    HttpResponse::Ok().json(datasets)
}

#[get("dataset/{uuid}")]
pub async fn find_by_uuid(path: web::Path<Uuid>, data: web::Data<AppState>) -> HttpResponse {
    let uuid = path.into_inner();
    let fetched = dataset_find_by_uuid(&data.conn, uuid).await;

    if let Err(error) = fetched {
        return HttpResponse::InternalServerError().body(error.to_string());
    }

    let dataset_option = fetched.unwrap();

    dataset_option
        .map(|ds| HttpResponse::Ok().json(ds))
        .unwrap_or(HttpResponse::NotFound().body(uuid.to_string()))
}
