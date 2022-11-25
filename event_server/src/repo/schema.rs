
use entity::{subject, schema};
use migration::sea_orm::{ActiveModelTrait, Set};
use migration::{sea_orm, DbErr};
use chrono::prelude::*;

async fn add_schema_inner(
    db: &sea_orm::DatabaseConnection,
    subject: subject::Model,
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

pub async fn add_schema(
    db: &sea_orm::DatabaseConnection,
    subject_name: &str,
    schema: schema::Model,
) -> Result<schema::ActiveModel, DbErr> {
    let subject = 
        super::subject::find_by_name(db, subject_name)
            .await?
            .ok_or_else(|| 
                DbErr::RecordNotFound(format!("subject_name={:?}", subject_name)
            )
        );

//    let (subjects, schemas): (Vec<_>, Vec<_>) =
//        super::subject::find_by_name_eager(db, subject_name).await?.into_iter().unzip();
    
    add_schema_inner(db, subject?, schema).await
}