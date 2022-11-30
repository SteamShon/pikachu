use sea_orm::{Linked, RelationDef};

use crate::{subject, schema, subject_schema};


#[derive(Debug)]
pub struct SubjectToSchema;

impl Linked for SubjectToSchema {
    type FromEntity = subject::Entity;
    type ToEntity = schema::Entity;

    fn link(&self) -> Vec<RelationDef> {
        vec![
            sea_orm::RelationTrait::def(&subject_schema::Relation::Subject).rev(),
            sea_orm::RelationTrait::def(&subject_schema::Relation::Schema),
        ]
    }
}