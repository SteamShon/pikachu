use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};

use crate::db::{
    ad_group, campaign, content, content_type, creative, cube, cube_config, placement,
    placement_group, service, PrismaClient,
};
use filter::filter::{TargetFilter, UserInfo};
use filter::filterable::Filterable;
use filter::index::FilterIndex;
use serde::Serialize;

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

#[derive(Serialize)]
pub struct SearchResult {
    pub matched_ads: Vec<ad_group::Data>,
    // pub grouped: HashMap<String, HashMap<String, HashMap<String, ad_group::Data>>>,
    pub non_filter_ads: Vec<ad_group::Data>,
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
                                filter: Some(String::from(
                                    r#"
                                    {
                                        "type": "and", 
                                        "fields": [
                                            {"type": "in", "dimension": "o_orderstatus", "values": ["O"]},
                                            {"type": "in", "dimension": "c_mktsegment", "values": ["FURNITURE"]},
                                            {"type": "in", "dimension": "l_returnflag", "values": ["N"]}
                                        ]
                                    }
                                "#,
                                )),
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
    ) -> SearchResult {
        let user_info = Self::parse_user_info(user_info_json).unwrap();
        let matched_ids = self.filter_index.search(&user_info);
        let matched_ads =
            Self::transform_ids_to_ads(&self.ad_group_meta, placement_group_id, matched_ids.iter());
        let non_filter_ads = Self::transform_ids_to_ads(
            &self.ad_group_meta,
            placement_group_id,
            self.filter_index.non_filter_ids.iter(),
        );

        SearchResult {
            matched_ads,
            non_filter_ads,
        }
    }
    fn transform_ids_to_ads<'a, I>(
        id_meta_map: &HashMap<String, ad_group::Data>,
        placement_group_id: &str,
        ids: I,
    ) -> Vec<ad_group::Data>
    where
        I: Iterator<Item = &'a String>,
    {
        let mut ads = Vec::new();
        for id in ids {
            for ad_meta in id_meta_map.get(id) {
                for campaign in ad_meta.campaign.iter() {
                    for placement in campaign.placement.iter() {
                        for placement_group in placement.placement_group.iter() {
                            match placement_group {
                                Some(pg) if pg.id == placement_group_id => {
                                    ads.push(ad_meta.clone());
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
        ads
    }
    fn transform_ids_to_ads_grouped<'a, I>(
        id_meta_map: &HashMap<String, ad_group::Data>,
        placement_group_id: &str,
        ids: I,
    ) -> HashMap<String, HashMap<String, HashMap<String, ad_group::Data>>>
    where
        I: Iterator<Item = &'a String>,
    {
        let mut ads = HashMap::new();

        for id in ids {
            for ad_meta in id_meta_map.get(id) {
                for campaign in ad_meta.campaign.iter() {
                    for placement in campaign.placement.iter() {
                        for placement_group in placement.placement_group.iter() {
                            match placement_group {
                                Some(pg) if pg.id == placement_group_id => {
                                    ads.entry(placement.id.clone())
                                        .or_insert_with(|| HashMap::new())
                                        .entry(campaign.id.clone())
                                        .or_insert_with(|| HashMap::new())
                                        .entry(ad_meta.id.clone())
                                        .or_insert_with(|| ad_meta.clone());
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
        ads
    }
}
