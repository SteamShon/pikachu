
use cached::proc_macro::once;
use entity::subject::{Entity as Subject, self};
use entity::schema::{Entity as Schema, self};
use json_value_merge::Merge;
use migration::sea_orm::{ActiveModelTrait, Set, DatabaseConnection, EntityTrait, QueryFilter, ModelTrait, ColumnTrait, IntoActiveModel, QueryOrder, QuerySelect};
use migration::{sea_orm, DbErr};
use chrono::prelude::*;
use serde_json::json;

fn into_subject_schema(fetched: Vec<(subject::Model, Vec<schema::Model>)>) -> 
    (Option<subject::Model>, Option<schema::Model>) {

    let subject_with_schema = 
        fetched
            .first()
            .map(|(s, c)| 
                (s.to_owned(), c.first().map(|x| x.to_owned()))
            );

    let (subject, schema) = match subject_with_schema {
        Some((subject, schema)) => (Some(subject), Some(schema)),
        None => (None, None)
    };
    
    (subject, schema.flatten())
}

#[once(result = true, time = 10)]
pub async fn find_by_latest_version(
    db: &sea_orm::DatabaseConnection, 
    subject_name: &str,
) -> Result<(Option<subject::Model>, Option<schema::Model>), DbErr> {
    let fetched = Subject::find()
    .filter(subject::Column::Name.eq(subject_name))
    .find_with_related(Schema)
    .order_by_desc(schema::Column::Version)
    .offset(0)
    .limit(1)
    .all(db)
    .await;

    Ok(into_subject_schema(fetched?))
}

#[once(result = true, time = 10)]
pub async fn find_by_version(
    db: &sea_orm::DatabaseConnection, 
    subject_name: &str,
    version: &str,
) -> Result<(Option<subject::Model>, Option<schema::Model>), DbErr> {
    let fetched = Subject::find()
        .filter(subject::Column::Name.eq(subject_name))
        .find_with_related(Schema)
        .filter(schema::Column::Version.eq(version))
        .all(db)
        .await;

    Ok(into_subject_schema(fetched?))
}

async fn create_inner(
    db: &sea_orm::DatabaseConnection,
    subject: &subject::Model,
    schema: schema::Model,
) -> Result<schema::ActiveModel, DbErr> {
    let active_model: schema::ActiveModel = schema::ActiveModel {
        subject_id: Set(subject.id),
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
        super::subject::find_by_subject_name_eager(db, subject_name)
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
    version: &str,
    form_data: serde_json::Value) -> Result<schema::Model, DbErr> {
    let subject = 
        super::subject::find_by_name(db, subject_name)
            .await?.ok_or_else(|| DbErr::RecordNotFound(subject_name.to_string()))?;
    
    let schema = subject.find_related(Schema)
        .filter(entity::schema::Column::Version.eq(version))
        .one(db)
        .await?
        .ok_or_else(|| DbErr::RecordNotFound(version.to_string()))?;
          
    let mut schema_json: serde_json::Value = json!(schema);
    schema_json.merge(form_data);
    let merged: serde_json::Value = schema_json.clone();

    let mut active_model = schema.into_active_model();
    active_model.set_from_json(merged)?;
    
    active_model.update(db).await    
}
