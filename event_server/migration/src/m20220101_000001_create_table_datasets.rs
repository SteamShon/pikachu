use sea_orm_migration::{prelude::*, sea_orm::{Statement, ConnectionTrait}};

#[derive(DeriveMigrationName)]
pub struct Migration;
#[derive(Iden)]
enum Dataset {
    Table,
    Id,
    Name,
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // let sql = r#"
        // CREATE TABLE `datasets` (
        //     `id` INTEGER PRIMARY KEY AUTOINCREMENT,
        //     `name` varchar(255) NOT NULL
        // )"#;
        // let stmt = Statement::from_string(manager.get_database_backend(), sql.to_owned());
        // manager.get_connection().execute(stmt).await.map(|_| ())
        manager
            .create_table(
            sea_query::Table::create()
                .table(Dataset::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(Dataset::Id)
                        .integer()
                        // .not_null()
                        .auto_increment()
                        .primary_key()
                )
                .col(ColumnDef::new(Dataset::Name).string().not_null().unique_key())
                .to_owned()
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // let sql = "DROP TABLE `datasets`";
        // let stmt = Statement::from_string(manager.get_database_backend(), sql.to_owned());
        // manager.get_connection().execute(stmt).await.map(|_| ())
        manager
            .drop_table(
                sea_query::Table::drop()
                .table(Dataset::Table)
                .to_owned()
            ).await
    }
}
