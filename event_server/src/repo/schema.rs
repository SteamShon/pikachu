
use entity::{subject, schema};
use json_value_merge::Merge;
use migration::sea_orm::{ActiveModelTrait, Set, DatabaseConnection, EntityTrait, QueryFilter, ModelTrait, ColumnTrait, IntoActiveModel};
use migration::{sea_orm, DbErr};
use chrono::prelude::*;
use entity::schema::{Entity as Schema};
use entity::subject::{Entity as Subject};
use serde_json::json;

async fn create_inner(
    db: &sea_orm::DatabaseConnection,
    subject: &subject::Model,
    schema: schema::Model,
) -> Result<schema::ActiveModel, DbErr> {
    let active_model: schema::ActiveModel = schema::ActiveModel {
        subject_id: Set(subject.id),
        name: Set(schema.name),
        version: Set(Utc::now().timestamp_micros().to_string()),
        schema_type: Set(schema.schema_type),
        schema: Set(schema.schema),
        ..Default::default()
    };

    active_model.save(db).await
}

pub fn validate_schema(new_schema: &schema::Model, old_schemas: &Vec<schema::Model>) -> bool {
    true
}

pub async fn create_with_validation(
    db: &sea_orm::DatabaseConnection,
    subject_name: &str,
    schema: schema::Model,
) -> Result<schema::ActiveModel, DbErr> {
    //1. first fetch subject.
    //2. find all related schemas.
    //3. run schema validate(new_schema, old_schemas)
    //4. only when validate succes, create new schema under this subject.
    let subject_with_schemas = 
        super::subject::find_by_name_eager(db, subject_name)
        .await?;

    let (subject, schemas) = subject_with_schemas
        .first()
        .ok_or_else(|| DbErr::RecordNotFound(format!("subject {:?} is not found.", subject_name)))?;
    
    if validate_schema(&schema, &schemas) {
        create_inner(db, &subject, schema).await
    } else {
        Err(DbErr::RecordNotFound("".to_string()))
    }
}

pub async fn update(
    db: &DatabaseConnection, 
    subject_name: &str, 
    schema_name: &str, 
    version: &str,
    form_data: serde_json::Value) -> Result<schema::Model, DbErr> {
    let subject = 
        super::subject::find_by_name(db, subject_name)
            .await?.ok_or_else(|| DbErr::RecordNotFound(subject_name.to_string()))?;
    
    let schema = subject.find_related(Schema)
        .filter(
            entity::schema::Column::Name.eq(schema_name)
                .and(entity::schema::Column::Version.eq(version))
        ).one(db).await?.ok_or_else(|| DbErr::RecordNotFound(schema_name.to_string()))?;
          
    let mut schema_json: serde_json::Value = json!(schema);
    schema_json.merge(form_data);
    let merged: serde_json::Value = schema_json.clone();

    let mut active_model = schema.into_active_model();
    active_model.set_from_json(merged)?;
    
    active_model.update(db).await    
}
