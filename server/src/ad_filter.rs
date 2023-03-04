use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};

use crate::db::{
    ad_group, campaign, content, content_type, creative, cube, cube_config, placement,
    placement_group, service, PrismaClient,
};
use filter::filter::{TargetFilter, UserInfo};
use filter::filterable::Filterable;
use filter::index::FilterIndex;

impl Filterable for ad_group::Data {
    fn id(&self) -> String {
        String::from(&self.id)
    }

    fn filter(&self) -> Option<TargetFilter> {
        match &self.filter {
            None => None,
            Some(s) => {
                let value: serde_json::Value = serde_json::from_str(&s).ok()?;
                TargetFilter::from(&value)
            }
        }
    }
}

#[derive(Debug)]
pub struct AdState {
    pub ad_group_meta: HashMap<String, ad_group::Data>,
    pub filter_index: FilterIndex,
}

impl AdState {
    fn build_ad_group_meta(services: &Vec<service::Data>) -> HashMap<String, ad_group::Data> {
        let mut ad_group_meta = HashMap::new();

        for service in services {
            for placement_group in service.placement_groups().unwrap_or(&Vec::new()) {
                for placement in placement_group.placements().unwrap_or(&Vec::new()) {
                    for campaign in placement.campaigns().unwrap_or(&Vec::new()) {
                        for ad_group in campaign.ad_groups().unwrap_or(&Vec::new()) {
                            let new_service = service::Data {
                                placement_groups: None,
                                content_types: None,
                                cube_configs: None,
                                customsets: None,
                                ..service.clone()
                            };
                            let new_placement_group = placement_group::Data {
                                placements: None,
                                service: Some(Some(Box::new(new_service.clone()))),
                                ..placement_group.clone()
                            };
                            let new_placement = placement::Data {
                                advertisers_on_placements: None,
                                placement_group: Some(Some(Box::new(new_placement_group))),
                                campaigns: None,
                                ..placement.clone()
                            };
                            let new_campaign = campaign::Data {
                                placement: Some(Box::new(new_placement)),
                                ad_groups: None,
                                ..campaign.clone()
                            };

                            let new_ad_group = ad_group::Data {
                                campaign: Some(Box::new(new_campaign)),
                                filter: Some(String::from(r#"
                                    {
                                        "type": "and", 
                                        "fields": [
                                            {"type": "in", "dimension": "o_orderstatus", "values": ["O"]},
                                            {"type": "in", "dimension": "c_mktsegment", "values": ["FURNITURE"]},
                                            {"type": "in", "dimension": "l_returnflag", "values": ["N"]}
                                        ]
                                    }
                                "#)),
                                ..ad_group.clone()
                            };
                            ad_group_meta.insert(ad_group.id.clone(), new_ad_group);
                        }
                    }
                }
            }
        }
        ad_group_meta
    }

    pub async fn new(client: Arc<PrismaClient>) -> AdState {
        let services: Vec<service::Data> = client
            .service()
            .find_many(vec![])
            .with(
                service::placement_groups::fetch(vec![]).with(
                    placement_group::placements::fetch(vec![])
                        .with(placement::content_type::fetch())
                        .with(placement::campaigns::fetch(vec![]).with(
                            campaign::ad_groups::fetch(vec![]).with(
                                ad_group::creatives::fetch(vec![]).with(creative::content::fetch()),
                            ),
                        )),
                ),
            )
            .with(service::cube_configs::fetch(vec![]).with(cube_config::cubes::fetch(vec![])))
            .exec()
            .await
            .unwrap();

        println!("AdState: fetched {:?}", services.len());

        let ad_group_meta = Self::build_ad_group_meta(&services);
        let filters: Vec<ad_group::Data> = ad_group_meta.values().cloned().collect();
        let filter_index = FilterIndex::new(&filters);

        println!("Index: {:?}", filter_index.debug());

        AdState {
            ad_group_meta,
            filter_index,
        }
    }
    fn parse_user_info(value: &serde_json::Value) -> Option<UserInfo> {
        let mut user_info = HashMap::new();
        for (k, v) in value.as_object()?.iter() {
            let mut items = HashSet::new();
            for item in v.as_array()? {
                for str in item.as_str() {
                    items.insert(String::from(str));
                }
            }
            user_info.insert(k.clone(), items);
        }

        Some(user_info)
    }
    pub fn search(
        &self,
        service_id: &str,
        placement_group_id: &str,
        user_info_json: &serde_json::Value,
    ) -> Vec<ad_group::Data> {
        let user_info = Self::parse_user_info(user_info_json).unwrap();
        println!("{:?}", user_info);
        
        let mut matched_ad_ids = Vec::new();
        for matched_ad_id in self.filter_index.search(&user_info) {
            for ad_meta in self.ad_group_meta.get(&matched_ad_id) {
                for campaign in ad_meta.campaign.iter() {
                    for placement in campaign.placement.iter() {
                        for placement_group in placement.placement_group.iter() {
                            match placement_group {
                                Some(pg) if pg.id == placement_group_id => {
                                    matched_ad_ids.push(ad_meta.clone());
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
        matched_ad_ids
    }
}
