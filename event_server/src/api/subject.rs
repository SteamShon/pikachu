use entity::entity_linked;
use entity::subject::{Entity as Subject, self};
use entity::schema::{Entity as Schema, self};

use migration::sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use migration::{sea_orm, DbErr};

pub async fn find_by_name_eager(
    db: &sea_orm::DatabaseConnection, 
    name: &str
) -> Result<Vec<(subject::Model, Option<schema::Model>)>, DbErr>  {
    Subject::find()
        .filter(subject::Column::Name.eq(name))
        .find_also_linked(entity_linked::SubjectToSchema)
        .all(db)
        .await
}
