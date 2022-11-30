use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Deserialize, Serialize)]
#[sea_orm(table_name = "subject")]
pub struct Model {
    #[sea_orm(primary_key)]
    #[serde(skip_deserializing)]
    pub id: i32,

    #[sea_orm(unique)]
    pub name: String,

    #[sea_orm(default_value="AVRO")]
    pub data_format: String,
    #[sea_orm(default_value="BACKWARD")]
    pub compatibility: String,
    
    #[sea_orm(default_value="CREATED")]
    #[serde(skip_deserializing)]
    pub status: String,

    #[sea_orm(unique)]
    #[serde(skip_deserializing)]
    pub uuid: Uuid,

    #[sea_orm(nullable)]
    pub topic_name: Option<String>,

    #[sea_orm(nullable)]
    pub topic_config: Option<String>
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::schema::Entity")]
    Schema,
}

impl Related<super::schema::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Schema.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

