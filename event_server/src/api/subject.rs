use entity::subject::{Entity as Subject, self};
use entity::schema::{Entity as Schema, self};

use migration::sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use migration::{sea_orm, DbErr};

pub async fn find_by_name(
    db: &sea_orm::DatabaseConnection, 
    name: &str
) -> Result<Vec<(subject::Model, Vec<schema::Model>)>, DbErr>  {
    Subject::find()
    .filter(subject::Column::Name.eq(name))
    .find_with_related(Schema)
    .all(db)
    .await
}
