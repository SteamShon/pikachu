use super::AdState;

use crate::{db::{ad_group, campaign, content, content_type, creative, placement, service}, ad_state_builder::{update_contents, update_creatives, update_ad_groups, update_campaigns, update_placements, update_services}, util::parse_user_info};
use lazy_static::lazy_static;
use prisma_client_rust::chrono::FixedOffset;
use serde_json::json;
use std::collections::HashSet;

lazy_static! {
    pub static ref NOW: prisma_client_rust::chrono::DateTime<FixedOffset> =
        prisma_client_rust::chrono::offset::Utc::now()
            .with_timezone(&FixedOffset::east_opt(0).unwrap());
    pub static ref SERVICE: service::Data = service::Data {
        id: String::from("service_1"),
        name: String::from("s1"),
        description: None,
        status: String::from("published"),
        placements: None,
        users: None,
        content_types: None,
        service_config: None,
        customsets: None,
        integrations: None,
        providers: None,
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref PLACEMENT: placement::Data = placement::Data {
        id: String::from("placement_1"),
        name: String::from("p1"),
        description: None,
        status: String::from("published"),
        advertisers_on_placements: None,
        campaigns: None,
        content_type: None,
        content_type_id: Some(CONTENT_TYPE.id.clone()),
        service: None,
        service_id: Some(SERVICE.id.clone()),
        integrations: None,
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref CAMPAIGN: campaign::Data = campaign::Data {
        id: String::from("campaign_1"),
        name: String::from("cp1"),
        description: None,
        status: String::from("published"),
        ad_groups: None,
        placement: None,
        placement_id: PLACEMENT.id.clone(),
        started_at: None,
        end_at: None,
        r#type: String::from("DISPLAY"),
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref AD_GROUP_FILTER: String = String::from(r#"{"in": [{"var": "age"}, ["10"]]}"#);
    pub static ref AD_GROUP: ad_group::Data = ad_group::Data {
        id: String::from("ad_group_1"),
        name: String::from("ag_1"),
        description: None,
        status: String::from("published"),
        campaign: None,
        campaign_id: CAMPAIGN.id.clone(),
        creatives: None,
        filter: Some(AD_GROUP_FILTER.clone()),
        population: None,
        created_at: *NOW,
        updated_at: *NOW,
    };
    pub static ref CREATIVE: creative::Data = creative::Data {
        id: String::from("creative_1"),
        name: String::from("c_1"),
        description: None,
        status: String::from("published"),
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
        r#type: String::from("DISPLAY"),
        service_id: Some(SERVICE.id.clone()),
        service: None,
        description: None,
        contents: None,
        placements: None,
        content_type_info: None,
        source: String::from("local"),
        status: String::from("published"),
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
        status: String::from("published"),
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
    update_services(ad_state, &vec![SERVICE.clone()]);
    update_placements(ad_state, &vec![PLACEMENT.clone()]);
    update_campaigns(ad_state, &vec![CAMPAIGN.clone()]);
    update_ad_groups(ad_state, &vec![AD_GROUP.clone()]);
    update_creatives(ad_state, &vec![CREATIVE.clone()]);
    update_contents(ad_state, &vec![CONTENT.clone()]);
}

#[test]
fn test_ad_state_update() {
    let mut ad_state = AdState::default();
    let service_id = String::from(SERVICE.id.clone());
    assert_eq!(ad_state.services.contains_key(&service_id), false);
    init_test_ad_state(&mut ad_state);

    assert_eq!(ad_state.services.contains_key(&service_id), true);
}

#[test]
fn test_ad_state_and_search_result_after_update() {
    let user_info_json = json!({
        "age": HashSet::from([String::from("10")])
    });
    let mut ad_state = AdState::default();
    init_test_ad_state(&mut ad_state);
    let user_info = parse_user_info(&user_info_json).unwrap();
    let ad_group_id = String::from(AD_GROUP.id.clone());
    let placement_id = PLACEMENT.id.clone();
    let campaign_id = CAMPAIGN.id.clone();
    let ids = vec![ad_group_id];

    // before update.
    let placement_ids = 
        ad_state.merge_ids_with_ad_metas(&user_info, ids.iter(), None);

    assert_eq!(placement_ids.contains_key(&placement_id), true);
    let campaign_ids = placement_ids.get(&placement_id).unwrap();

    assert_eq!(campaign_ids.contains_key(&campaign_id), true);
    let ad_groups = campaign_ids.get(&campaign_id).unwrap();
    for ad_group in ad_groups {
        assert_eq!(ad_group.name, AD_GROUP.name);
        for creative in ad_group.creatives().unwrap().iter() {
            assert_eq!(creative.name, CREATIVE.name);
        }
    }
    // search result: match since user_info {"age": 10} matches to original
    // filter {"in": [{"var": "age"}, ["10"]]}

    let search_result = ad_state.search(&SERVICE.id, &placement_id, &user_info_json, None);
    assert_eq!(search_result.matched_ads.len() > 0, true);

    // update ad_group/creative including target filter conditions.
    let new_ad_group_name = &String::from("new_ad_group_1");
    let new_ad_group = ad_group::Data {
        name: new_ad_group_name.clone(),
        filter: Some(String::from(
            r#"
            {"in": [{"var": "age"}, ["30"]]}
        "#,
        )),
        ..AD_GROUP.clone()
    };
    let new_creative_name = &String::from("new_creative_1");
    let new_creative = creative::Data {
        name: new_creative_name.clone(),
        ..CREATIVE.clone()
    };
    // after update
    update_ad_groups(&mut ad_state, &vec![new_ad_group]);
    update_creatives(&mut ad_state, &vec![new_creative]);
    println!("{:?}", ad_state.filter_index);

    let new_placement_ids = 
        ad_state.merge_ids_with_ad_metas(&user_info, ids.iter(), None);

    for ad_group in new_placement_ids
        .get(&placement_id)
        .unwrap()
        .get(&campaign_id)
        .unwrap()
    {
        assert_eq!(ad_group.name, *new_ad_group_name);
        for creative in ad_group.creatives().unwrap().iter() {
            assert_eq!(creative.name, *new_creative_name);
        }
    }
    // after update, ad_group should not matched since filter changed from
    // age.10 to age.30 and user_info has age.10
    let search_result = ad_state.search(&SERVICE.id, &placement_id, &user_info_json, None);
    assert_eq!(search_result.matched_ads.len() == 0, true);

    println!("{:?}", new_placement_ids);
}

#[test]
/*
test if the changes on ad_group's filter and status
 */
fn test_update_ad_group_filter_and_status_change() {
    let user_info_json = json!({
        "age": HashSet::from([String::from("10")])
    });
    let mut ad_state = AdState::default();
    init_test_ad_state(&mut ad_state);

    // result should contain AD_GROUP since age.10
    let search_result = ad_state.search(&SERVICE.id, &PLACEMENT.id, &user_info_json, None);
    assert_eq!(search_result.matched_ads.len() > 0, true);

    // update ad_group's status to exlucde it from index.
    let new_ad_group_name = &String::from("new_ad_group_1");
    let mut new_ad_group = ad_group::Data {
        name: new_ad_group_name.clone(),
        filter: AD_GROUP.filter.clone(),
        status: String::from("archieved"),
        ..AD_GROUP.clone()
    };

    update_ad_groups(&mut ad_state, &vec![new_ad_group]);
    // after update, AD_GROUP should be excluded from result since
    // our index suppose to exlude filters_to_delete.
    let search_result = ad_state.search(&SERVICE.id, &PLACEMENT.id, &user_info_json, None);
    assert_eq!(search_result.matched_ads.len() == 0, true);

    // back to status published.
    new_ad_group = ad_group::Data {
        name: new_ad_group_name.clone(),
        filter: AD_GROUP.filter.clone(),
        status: String::from("published"),
        ..AD_GROUP.clone()
    };
    update_ad_groups(&mut ad_state, &vec![new_ad_group]);
    // after update, AD_GROUP should be included in result.
    // since ad_group's status has been change back to published.
    let search_result = ad_state.search(&SERVICE.id, &PLACEMENT.id, &user_info_json, None);
    assert_eq!(search_result.matched_ads.len() > 0, true);
}
