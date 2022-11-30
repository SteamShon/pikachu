use sea_orm_migration::{
    prelude::*,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Subject::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Subject::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Subject::Name).string().not_null().unique_key())
                    .col(ColumnDef::new(Subject::DataFormat).string().not_null().default("AVRO"))
                    .col(ColumnDef::new(Subject::Compatibility).string().not_null().default("BACKWARD"))
                    .col(ColumnDef::new(Subject::Status).string().not_null().default("CREATED"))
                    .col(ColumnDef::new(Subject::Uuid).uuid().not_null())
                    .col(ColumnDef::new(Subject::TopicName).string().null())
                    .col(ColumnDef::new(Subject::TopicConfig).string().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Subject::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum Subject {
    Table,
    Id,
    Name,
    DataFormat,
    Compatibility,
    Status,
    Uuid,
    TopicName,
    TopicConfig,
}
