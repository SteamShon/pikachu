use entity::subject::{Entity as Subject, self};
use entity::schema::{Entity as Schema, self};

use json_value_merge::Merge;
use migration::sea_orm::{ColumnTrait, EntityTrait, QueryFilter, ActiveModelTrait, Set, DatabaseConnection, IntoActiveModel};
use migration::{sea_orm, DbErr};
use serde_json::json;
use uuid::Uuid;

pub async fn find_all(
    db: &sea_orm::DatabaseConnection, 
) -> Result<Vec<(subject::Model, Vec<schema::Model>)>, DbErr>{
    let subjects = Subject::find()
    .find_with_related(Schema)
    .all(db)
    .await;

    subjects
}

pub async fn find_by_name(
    db: &sea_orm::DatabaseConnection, 
    name: &str,
) -> Result<Option<subject::Model>, DbErr>{
    Subject::find()
        .filter(subject::Column::Name.eq(name))
        .one(db)
        .await
}

pub async fn find_by_subject_name_eager(
    db: &sea_orm::DatabaseConnection, 
    subject_name: &str
) -> Result<Vec<(subject::Model, Vec<schema::Model>)>, DbErr>{
    /*
    Subject::find()
        .filter(subject::Column::Name.eq(name))
        .find_also_linked(entity_linked::SubjectToSchema)
        .all(db)
        .await
    */
    let subjects = Subject::find()
    .filter(subject::Column::Name.eq(subject_name))
    .find_with_related(Schema)
    .all(db)
    .await;

    subjects
}


pub async fn find_by_schema_name_eager(
    db: &sea_orm::DatabaseConnection, 
    subject_name: &str,
    schema_name: &str,
) -> Result<Vec<(subject::Model, Vec<schema::Model>)>, DbErr>{
    let subjects = Subject::find()
    .filter(subject::Column::Name.eq(subject_name))
    .find_with_related(Schema)
    .filter(schema::Column::Name.eq(schema_name))
    .all(db)
    .await;

    subjects
}

pub async fn create(
    db: &sea_orm::DatabaseConnection,
    subject: subject::Model
) -> Result<subject::ActiveModel, DbErr> {
    let active_model: subject::ActiveModel = subject::ActiveModel {
        name: Set(subject.name),
        data_format: Set(subject.data_format),
        compatibility: Set(subject.compatibility),
        status: Set("CREATED".to_string()),
        uuid: Set(Uuid::new_v4()),
        ..Default::default()
    };
    
    active_model.save(db).await
}

pub async fn update(
    db: &DatabaseConnection,
    subject_name: &str,
    form_data: serde_json::Value,
) -> Result<subject::Model, DbErr> {
    let subject = 
        find_by_name(db, subject_name).await?.ok_or_else(|| 
            DbErr::RecordNotFound(format!("subject_name={:?}", subject_name))
        )?;

    let mut subject_json: serde_json::Value = json!(subject);
    subject_json.merge(form_data);
    let merged: serde_json::Value = subject_json.clone();

    let mut active_model = subject.into_active_model();
    active_model.set_from_json(merged)?;
    
    active_model.update(db).await
}