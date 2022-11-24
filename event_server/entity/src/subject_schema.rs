use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Deserialize, Serialize)]
#[sea_orm(table_name = "subject_schema")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub subject_id: i32,
    #[sea_orm(primary_key)]
    pub schema_id: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::subject::Entity",
        from = "Column::SubjectId",
        to = "super::subject::Column::Id"
    )]
    Subject,
    #[sea_orm(
        belongs_to = "super::schema::Entity",
        from = "Column::SchemaId",
        to = "super::schema::Column::Id"
    )]
    Schema,
}

impl ActiveModelBehavior for ActiveModel {}