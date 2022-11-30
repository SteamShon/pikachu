pub use sea_orm_migration::prelude::*;

mod m20221124_164916_create_schema;
mod m20221124_165438_create_subject;
mod m20221124_220029_create_subject_schema;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20221124_164916_create_schema::Migration),
            Box::new(m20221124_165438_create_subject::Migration),
            Box::new(m20221124_220029_create_subject_schema::Migration),
        ]
    }
}
