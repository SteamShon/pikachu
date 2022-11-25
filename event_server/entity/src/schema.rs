use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Deserialize, Serialize)]
#[sea_orm(table_name = "schema")]
pub struct Model {
    #[sea_orm(primary_key)]
    #[serde(skip_deserializing)]
    pub id: i32,

    #[serde(skip_deserializing)]
    pub subject_id: i32,
    
    pub name: String,

    #[serde(skip_deserializing)]
    pub version: String,

    pub schema_type: String,
    
    #[sea_orm(column_type = "Text")]
    pub schema: String,

}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::subject::Entity",
        from = "Column::SubjectId",
        to = "super::subject::Column::Id",
    )]
    Subject,
}

impl Related<super::subject::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Subject.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
