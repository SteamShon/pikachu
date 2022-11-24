use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Schema::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Schema::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Schema::Version).string().not_null())
                    .col(ColumnDef::new(Schema::Schema).string().not_null())
                    .col(ColumnDef::new(Schema::SubjectId).integer().not_null())
                    .to_owned(),
            )
            .await?;

        manager.create_index(Index::create()
            .if_not_exists()
            .name("unique-index-schema")
            .table(Schema::Table)
            .col(Schema::SubjectId)
            .col(Schema::Version)
            .to_owned()).await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Schema::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum Schema {
    Table,
    Id,
    Name,
    Version,
    Schema,
    SubjectId,
}
