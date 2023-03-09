use super::AdState;

use crate::db::{
    ad_group, campaign, content, content_type, creative, placement, placement_group, service,
};
use actix_web::web::{self};
use dotenv::dotenv;
use lazy_static::lazy_static;
use prisma_client_rust::chrono::{DateTime, FixedOffset, TimeZone};
use std::{env, sync::Arc};

lazy_static! {
    pub static ref NOW: prisma_client_rust::chrono::DateTime<FixedOffset> =
        prisma_client_rust::chrono::offset::Utc::now().with_timezone(&FixedOffset::east(0));
    pub static ref SERVICE: service::Data = service::Data {
        id: String::from("service_1"),
        name: String::from("s1"),
        description: None,
        status: String::from(""),
        placement_groups: None,
        users: None,
        content_types: None,
        cube_configs: None,
        customsets: None,
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref PLACEMENT_GROUP: placement_group::Data = placement_group::Data {
        id: String::from("placement_group_1"),
        name: String::from("pg1"),
        description: None,
        status: String::from(""),
        cube: None,
        cube_id: None,
        placements: None,
        service: None,
        service_id: Some(SERVICE.id.clone()),
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref PLACEMENT: placement::Data = placement::Data {
        id: String::from("placement_1"),
        name: String::from("p1"),
        description: None,
        status: String::from(""),
        advertisers_on_placements: None,
        campaigns: None,
        content_type: None,
        content_type_id: CONTENT_TYPE.id.clone(),
        placement_group: None,
        placement_group_id: Some(PLACEMENT_GROUP.id.clone()),
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref CAMPAIGN: campaign::Data = campaign::Data {
        id: String::from("campaign_1"),
        name: String::from("cp1"),
        description: None,
        status: String::from(""),
        ad_groups: None,
        placement: None,
        placement_id: PLACEMENT.id.clone(),
        started_at: None,
        end_at: None,
        r#type: String::from("DISPLAY"),
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref AD_GROUP: ad_group::Data = ad_group::Data {
        id: String::from("ad_group_1"),
        name: String::from("ag_1"),
        description: None,
        status: String::from(""),
        campaign: None,
        campaign_id: CAMPAIGN.id.clone(),
        creatives: None,
        filter: Some(String::from(r#"{"in": [{"var": "age"}, ["10"]]}"#)),
        population: None,
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref CREATIVE: creative::Data = creative::Data {
        id: String::from("creative_1"),
        name: String::from("c_1"),
        description: None,
        status: String::from(""),
        ad_group: None,
        ad_group_id: AD_GROUP.id.clone(),
        content: None,
        content_id: CONTENT.id.clone(),
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref CONTENT_TYPE: content_type::Data = content_type::Data {
        id: String::from("content_type_1"),
        name: String::from("ct1"),
        service_id: Some(SERVICE.id.clone()),
        service: None,
        description: None,
        contents: None,
        placements: None,
        default_values: None,
        schema: None,
        ui_schema: None,
        status: String::from(""),
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref CONTENT: content::Data = content::Data {
        id: String::from("content_1"),
        name: String::from("c1"),
        description: None,
        content_type: None,
        content_type_id: Some(CONTENT_TYPE.id.clone()),
        created_by: None,
        creator_id: String::from(""),
        user_id: None,
        creatives: None,
        values: String::from(""),
        status: String::from(""),
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref AD_STATE: AdState = {
        let mut ad_state = AdState::default();

        init_test_ad_state(&mut ad_state);

        ad_state
    };
}
fn init_test_ad_state(ad_state: &mut AdState) {
    ad_state.update_services(&vec![SERVICE.clone()]);
    ad_state.update_placement_groups(&vec![PLACEMENT_GROUP.clone()]);
    ad_state.update_placements(&vec![PLACEMENT.clone()]);
    ad_state.update_campaigns(&vec![CAMPAIGN.clone()]);
    ad_state.update_ad_groups(&vec![AD_GROUP.clone()]);
    ad_state.update_creatives(&vec![CREATIVE.clone()]);
    ad_state.update_contents(&vec![CONTENT.clone()]);
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
fn test_ad_state_update() {
    let mut ad_state = AdState::default();
    let service_id = String::from(SERVICE.id.clone());
    assert_eq!(ad_state.services.contains_key(&service_id), false);
    init_test_ad_state(&mut ad_state);

    assert_eq!(ad_state.services.contains_key(&service_id), true);
}
