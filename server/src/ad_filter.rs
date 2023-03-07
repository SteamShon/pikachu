use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use crate::db::{
    ad_group, campaign, content, content_type, creative, cube, cube_config, placement,
    placement_group, service, PrismaClient,
};
use filter::filter::{TargetFilter, UserInfo};
use filter::filterable::Filterable;
use filter::index::FilterIndex;
use prisma_client_rust::chrono::{DateTime, FixedOffset, TimeZone, Utc};
use prisma_client_rust::Direction;
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
                //TargetFilter::from(&value)
                TargetFilter::from_jsonlogic(&value)
            }
        }
    }
}

#[derive(Serialize)]
pub struct SearchResult {
    pub matched_ads: Vec<placement::Data>,
    // pub grouped: HashMap<String, HashMap<String, HashMap<String, ad_group::Data>>>,
    pub non_filter_ads: Vec<placement::Data>,
}
#[derive(Debug)]
pub struct UpdateInfo {
    pub services: DateTime<FixedOffset>,
    pub placement_groups: DateTime<FixedOffset>,
    pub placements: DateTime<FixedOffset>,
    pub campaigns: DateTime<FixedOffset>,
    pub ad_groups: DateTime<FixedOffset>,
}
impl Default for UpdateInfo {
    fn default() -> Self {
        Self {
            services: Default::default(),
            placement_groups: Default::default(),
            placements: Default::default(),
            campaigns: Default::default(),
            ad_groups: Default::default(),
        }
    }
}
#[derive(Debug)]
pub struct AdState {
    pub services: HashMap<String, service::Data>,
    pub placement_groups: HashMap<String, placement_group::Data>,
    pub placements: HashMap<String, placement::Data>,
    pub campaigns: HashMap<String, campaign::Data>,
    pub ad_groups: HashMap<String, ad_group::Data>,

    pub update_info: UpdateInfo,

    //pub ad_group_meta: HashMap<String, ad_group::Data>,
    pub filter_index: FilterIndex,
}
impl Default for AdState {
    fn default() -> Self {
        Self {
            services: Default::default(),
            placement_groups: Default::default(),
            placements: Default::default(),
            campaigns: Default::default(),
            ad_groups: Default::default(),
            update_info: Default::default(),
            filter_index: Default::default(),
        }
    }
}
impl AdState {
    pub async fn fetch_services(
        client: Arc<PrismaClient>,
        last_updated_at: DateTime<FixedOffset>,
    ) -> Vec<service::Data> {
        client
            .service()
            .find_many(vec![service::updated_at::gt(last_updated_at)])
            .with(service::cube_configs::fetch(vec![]).with(cube_config::cubes::fetch(vec![])))
            .order_by(service::updated_at::order(Direction::Desc))
            .exec()
            .await
            .unwrap()
    }
    async fn fetch_placement_groups(
        client: Arc<PrismaClient>,
        last_updated_at: DateTime<FixedOffset>,
    ) -> Vec<placement_group::Data> {
        //TODO: add index on updated_at to avoid full scan on a table.
        client
            .placement_group()
            .find_many(vec![placement_group::updated_at::gt(last_updated_at)])
            .order_by(placement_group::updated_at::order(Direction::Desc))
            .exec()
            .await
            .unwrap()
    }
    pub async fn fetch_placements(
        client: Arc<PrismaClient>,
        last_updated_at: DateTime<FixedOffset>,
    ) -> Vec<placement::Data> {
        client
            .placement()
            .find_many(vec![placement::updated_at::gt(last_updated_at)])
            .order_by(placement::updated_at::order(Direction::Desc))
            .with(placement::content_type::fetch())
            .exec()
            .await
            .unwrap()
    }
    pub async fn fetch_campaigns(
        client: Arc<PrismaClient>,
        last_updated_at: DateTime<FixedOffset>,
    ) -> Vec<campaign::Data> {
        client
            .campaign()
            .find_many(vec![campaign::updated_at::gt(last_updated_at)])
            .order_by(campaign::updated_at::order(Direction::Desc))
            .exec()
            .await
            .unwrap()
    }
    pub async fn fetch_ad_groups(
        client: Arc<PrismaClient>,
        last_updated_at: DateTime<FixedOffset>,
    ) -> Vec<ad_group::Data> {
        client
            .ad_group()
            .find_many(vec![ad_group::updated_at::gt(last_updated_at)])
            .order_by(ad_group::updated_at::order(Direction::Desc))
            .with(ad_group::creatives::fetch(vec![]).with(creative::content::fetch()))
            .exec()
            .await
            .unwrap()
    }
    pub fn update_services(&mut self, new_services: &Vec<service::Data>) -> () {
        let services = &mut self.services;
        for latest_updated_service in new_services.first() {
            let update_info = &mut self.update_info;
            update_info.services = latest_updated_service.updated_at;
        }
        for service in new_services {
            services.insert(service.id.clone(), service.clone());
        }
    }
    pub fn update_placement_groups(
        &mut self,
        new_placement_groups: &Vec<placement_group::Data>,
    ) -> () {
        let placement_groups = &mut self.placement_groups;
        for latest_updated_placement_group in new_placement_groups.first() {
            let update_info = &mut self.update_info;
            update_info.placement_groups = latest_updated_placement_group.updated_at;
        }
        for placement_group in new_placement_groups {
            placement_groups.insert(placement_group.id.clone(), placement_group.clone());
        }
    }
    pub fn update_placements(&mut self, new_placements: &Vec<placement::Data>) -> () {
        let placements = &mut self.placements;
        for latest_updated_placement in new_placements.first() {
            let update_info = &mut self.update_info;
            update_info.placements = latest_updated_placement.updated_at;
        }
        for placement in new_placements {
            placements.insert(placement.id.clone(), placement.clone());
        }
    }
    pub fn update_campaigns(&mut self, new_campaigns: &Vec<campaign::Data>) -> () {
        let campaigns = &mut self.campaigns;
        for latest_updated_campaign in new_campaigns.first() {
            let update_info = &mut self.update_info;
            update_info.campaigns = latest_updated_campaign.updated_at;
        }
        for campaign in new_campaigns {
            campaigns.insert(campaign.id.clone(), campaign.clone());
        }
    }
    pub fn update_ad_groups(&mut self, new_ad_groups: &Vec<ad_group::Data>) -> () {
        let filter_index = &mut self.filter_index;
        let ad_groups = &mut self.ad_groups;
        for latest_updated_ad_group in new_ad_groups.first() {
            let update_info = &mut self.update_info;
            update_info.ad_groups = latest_updated_ad_group.updated_at;
        }
        for ad_group in new_ad_groups {
            ad_groups.insert(ad_group.id.clone(), ad_group.clone());
        }
        filter_index.update(new_ad_groups);
    }
    pub async fn fetch_and_update_services(
        &mut self,
        client: Arc<PrismaClient>,
        last_updated_at: Option<DateTime<FixedOffset>>,
    ) -> () {
        let last_updated_at_value = last_updated_at.unwrap_or(self.update_info.services);
        let new_services = &Self::fetch_services(client, last_updated_at_value).await;
        println!("[new_services]: {:?}", new_services.len());
        self.update_services(new_services);
    }
    pub async fn fetch_and_update_placement_groups(
        &mut self,
        client: Arc<PrismaClient>,
        last_updated_at: Option<DateTime<FixedOffset>>,
    ) -> () {
        let last_updated_at_value = last_updated_at.unwrap_or(self.update_info.placement_groups);
        let new_placement_groups =
            &Self::fetch_placement_groups(client, last_updated_at_value).await;
        println!("[new_placement_groups]: {:?}", new_placement_groups.len());
        self.update_placement_groups(new_placement_groups);
    }
    pub async fn fetch_and_update_placements(
        &mut self,
        client: Arc<PrismaClient>,
        last_updated_at: Option<DateTime<FixedOffset>>,
    ) -> () {
        let last_updated_at_value = last_updated_at.unwrap_or(self.update_info.placements);
        let new_placements = &Self::fetch_placements(client, last_updated_at_value).await;
        println!("[new_placements]: {:?}", new_placements.len());
        self.update_placements(new_placements);
    }

    pub async fn fetch_and_update_campaigns(
        &mut self,
        client: Arc<PrismaClient>,
        last_updated_at: Option<DateTime<FixedOffset>>,
    ) -> () {
        let last_updated_at_value = last_updated_at.unwrap_or(self.update_info.campaigns);
        let new_campaigns = &Self::fetch_campaigns(client, last_updated_at_value).await;
        println!("[new_campaigns]: {:?}", new_campaigns.len());
        self.update_campaigns(new_campaigns);
    }
    pub async fn fetch_and_update_ad_groups(
        &mut self,
        client: Arc<PrismaClient>,
        last_updated_at: Option<DateTime<FixedOffset>>,
    ) -> () {
        let last_updated_at_value = last_updated_at.unwrap_or(self.update_info.ad_groups);
        let new_ad_groups = &Self::fetch_ad_groups(client, last_updated_at_value).await;
        println!("[new_ad_groups]: {:?}", new_ad_groups.len());
        self.update_ad_groups(new_ad_groups);
    }
    pub fn init() -> AdState {
        AdState::default()
    }
    pub async fn load(&mut self, client: Arc<PrismaClient>) -> () {
        self.fetch_and_update_services(client.clone(), None).await;
        self.fetch_and_update_placement_groups(client.clone(), None)
            .await;
        self.fetch_and_update_placements(client.clone(), None).await;
        self.fetch_and_update_campaigns(client.clone(), None).await;
        self.fetch_and_update_ad_groups(client.clone(), None).await;
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

        println!("[ids]: {:?}", matched_ids);

        let matched_ads = self.transform_ids_to_ads_grouped(placement_group_id, matched_ids.iter());
        let non_filter_ads = self.transform_ids_to_ads_grouped(
            placement_group_id,
            self.filter_index.non_filter_ids.lock().unwrap().iter(),
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
    fn build_placement_tree(
        &self,
        ids_with_meta: HashMap<String, HashMap<String, Vec<ad_group::Data>>>,
    ) -> Vec<placement::Data> {
        let mut ads = Vec::<placement::Data>::new();
        let placements = &self.placements;
        let campaigns = &self.campaigns;

        for (placement_id, campaign_id_ad_groups) in ids_with_meta {
            for placement in placements.get(&placement_id) {
                let mut new_campaigns = Vec::new();
                for (campaign_id, ad_groups) in campaign_id_ad_groups.iter() {
                    new_campaigns.push(campaign::Data {
                        ad_groups: Some(ad_groups.clone()),
                        placement: None,
                        ..campaigns.get(campaign_id).unwrap().clone()
                    });
                }

                ads.push(placement::Data {
                    advertisers_on_placements: None,
                    campaigns: Some(new_campaigns),
                    ..placement.clone()
                });
            }
        }
        ads
    }
    pub fn merge_ids_with_ad_metas<'a, I>(
        &self,
        placement_group_id: &str,
        ids: I,
    ) -> HashMap<String, HashMap<String, Vec<ad_group::Data>>>
    where
        I: Iterator<Item = &'a String>,
    {
        let mut tree = HashMap::<String, HashMap<String, Vec<ad_group::Data>>>::new();

        let placements = &self.placements;
        let campaigns = &self.campaigns;
        let ad_groups = &self.ad_groups;

        for id in ids {
            for ad_group in ad_groups.get(id) {
                for campaign in campaigns.get(&ad_group.campaign_id) {
                    for placement in placements.get(&campaign.placement_id) {
                        for current_placement_group_id in placement.placement_group_id.iter() {
                            if current_placement_group_id == placement_group_id {
                                tree.entry(placement.id.clone())
                                    .or_insert_with(|| HashMap::new())
                                    .entry(campaign.id.clone())
                                    .or_insert_with(|| Vec::new())
                                    .push(ad_group.clone());
                            }
                        }
                    }
                }
            }
        }

        tree
    }

    fn transform_ids_to_ads_grouped<'a, I>(
        &self,
        placement_group_id: &str,
        ids: I,
    ) -> Vec<placement::Data>
    where
        I: Iterator<Item = &'a String>,
    {
        let ids_with_meta = self.merge_ids_with_ad_metas(placement_group_id, ids);

        self.build_placement_tree(ids_with_meta)
    }
}
