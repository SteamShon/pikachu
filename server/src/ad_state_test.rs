use super::AdState;

use crate::db::{ad_group, content, service};
use actix_web::web::{self};
use dotenv::dotenv;
use lazy_static::lazy_static;
use prisma_client_rust::chrono::{DateTime, FixedOffset, TimeZone};
use std::{env, sync::Arc};

lazy_static! {
    pub static ref NOW: prisma_client_rust::chrono::DateTime<FixedOffset> =
        prisma_client_rust::chrono::offset::Utc::now().with_timezone(&FixedOffset::east(0));
    pub static ref CONTENTS: Vec<content::Data> = vec![content::Data {
        id: String::from("content_1"),
        name: String::from("c1"),
        description: None,
        content_type: None,
        content_type_id: None,
        created_by: None,
        creator_id: String::from(""),
        user_id: None,
        creatives: None,
        values: String::from(""),
        status: String::from(""),
        created_at: *NOW,
        updated_at: *NOW,
    },];
}
// #[tokio::test]
// async fn test_load() {
//     env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
//     dotenv().ok();

//     let database_url = env::var("DATABASE_URL").unwrap();
//     let prisma = Arc::new(db::new_client_with_url(&database_url).await.unwrap());
//     let mut ad_state = AdState::default();

//     ad_state.load(prisma).await;
//     println!("{:?}", ad_state);
// }
#[test]
fn test_update_contents() {
    let content_id = &CONTENTS[0].id;
    let mut ad_state = AdState::default();
    assert_eq!(ad_state.contents.contains_key(content_id), false);

    ad_state.update_contents(&CONTENTS);
    assert_eq!(ad_state.contents.contains_key(content_id), true);
}
