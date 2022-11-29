use std::str::FromStr;

use cached::proc_macro::once;
use entity::subject::{Entity as Subject, self};
use entity::schema::{Entity as Schema, self};
use json_value_merge::Merge;
use migration::sea_orm::{ActiveModelTrait, Set, DatabaseConnection, EntityTrait, QueryFilter, ModelTrait, ColumnTrait, IntoActiveModel, QueryOrder, QuerySelect};
use migration::{sea_orm, DbErr};
use chrono::prelude::*;
use serde_json::json;
use super::types::{Error as MyError, Schema as MySchema};

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


//TODO: Cache MySchema
fn into_parsed_schema(
    schema: &entity::schema::Model
) -> Result<MySchema, MyError> {
    if schema.schema_type.to_uppercase() == "AVRO" {
        apache_avro::Schema::parse_str(&schema.schema)
            .map(|schema| MySchema::Avro(schema))
            .map_err(|_error| MyError::AvroError )
    } else {
        match serde_json::from_str(&schema.schema) {
            Ok(json_schema) => {
                match jsonschema::JSONSchema::options()
                    .with_draft(jsonschema::Draft::Draft7)
                    .compile(&json_schema) {
                        Ok(compiled_schema) => Ok(MySchema::Json(compiled_schema)),
                        Err(_error) => Err(MyError::SchemaNotMatchedError)
                    }
            },
            Err(_error) => Err(MyError::SerdeJsonError)
        }
    }
}

fn to_bytes(
    parsed_schema: &MySchema, 
    event: &str,
) -> Result<Vec<u8>, MyError> {
    let json_event_result = serde_json::from_str(event);
    if let Err(_error) = json_event_result {
        return Err(MyError::SerdeJsonError)
    }

    let json_event: serde_json::Value = json_event_result.unwrap();

    match parsed_schema {
        MySchema::Avro(schema) => {
            /* 
            let rec = 
                avrow::Record::from_json(json_event.as_object().unwrap().to_owned(), &schema).unwrap();
            let mut writer = avrow::Writer::new(&schema, vec![]).unwrap();
            writer.write(rec).unwrap();

            let avro_data = writer.into_inner().unwrap();
            println!("avro_data: {:?}", avro_data);

            let reader = avrow::Reader::new(avro_data.as_slice()).unwrap();
            for val in reader {
                println!("value: {:?}", val);
            }
            */
            let mut writer = apache_avro::Writer::new(&schema, Vec::new());
            let record_option = apache_avro::types::Record::new(&schema);
            if let None = record_option {
                return Err(MyError::SchemaIsInvalid)
            }
            
            let mut record = record_option.unwrap();
            let kvs_option = json_event.as_object();
            if let None = kvs_option {
                return Err(MyError::EventDataNotObject)
            }
            let kvs = kvs_option.unwrap();

            for (k, v) in kvs {
                record.put(&k, v.to_owned());
            }
            //let avro_value = apache_avro::types::Value::from(json_event);
           
            match writer.append(record) {
                Err(_error) => Err(MyError::SchemaNotMatchedError),
                Ok(_encoded) => {
                    match writer.into_inner() {
                        Err(_error) => Err(MyError::SchemaNotMatchedError),
                        Ok(bytes) => {
                            println!("serialized: {:?}", event);

                            let reader = 
                                apache_avro::Reader::new(&bytes[..]).unwrap();
                            for value in reader {
                                println!("deserialized: {:?}", value.unwrap());
                            }

                            Ok(bytes)
                        }
                    }
                }
            }
        }
        MySchema::Json(schema) => {
            if schema.is_valid(&json_event) {
                Ok(event.as_bytes().to_vec())
            } else {
                Err(MyError::SchemaNotMatchedError)
            }
        }
    }
}

pub fn validate_events(
    schema: &entity::schema::Model, 
    events: Vec<String>
) -> Result<Vec<Result<Vec<u8>, MyError>>, MyError> {
    let parsed_schema = into_parsed_schema(&schema)?;

    let payloads: Vec<Result<Vec<u8>, MyError>> = 
        events.iter().map(|event| to_bytes(&parsed_schema, &event))
        .collect();

    Ok(payloads)
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
