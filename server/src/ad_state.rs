use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use crate::db::{
    ad_group, campaign, content, creative, cube_config, placement, placement_group, service,
    PrismaClient,
};
use filter::filter::{TargetFilter, UserInfo};
use filter::filterable::Filterable;
use filter::index::FilterIndex;
use prisma_client_rust::chrono::{DateTime, FixedOffset};
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
#[derive(Debug, Clone)]
pub struct UpdateInfo {
    pub services: DateTime<FixedOffset>,
    pub placement_groups: DateTime<FixedOffset>,
    pub placements: DateTime<FixedOffset>,
    pub campaigns: DateTime<FixedOffset>,
    pub ad_groups: DateTime<FixedOffset>,
    pub creatives: DateTime<FixedOffset>,
    pub contents: DateTime<FixedOffset>,
}
impl Default for UpdateInfo {
    fn default() -> Self {
        Self {
            services: Default::default(),
            placement_groups: Default::default(),
            placements: Default::default(),
            campaigns: Default::default(),
            ad_groups: Default::default(),
            creatives: Default::default(),
            contents: Default::default(),
        }
    }
}
#[derive(Debug, Clone)]
pub struct AdState {
    pub services: HashMap<String, service::Data>,
    pub placement_groups: HashMap<String, placement_group::Data>,
    pub placements: HashMap<String, placement::Data>,
    pub campaigns: HashMap<String, campaign::Data>,
    pub ad_groups: HashMap<String, ad_group::Data>,
    pub creatives: HashMap<String, HashMap<String, creative::Data>>,
    pub contents: HashMap<String, content::Data>,
    pub update_info: UpdateInfo,
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
            creatives: Default::default(),
            contents: Default::default(),
            update_info: Default::default(),
            filter_index: Default::default(),
        }
    }
}

impl AdState {
    pub fn from(other: &Self) -> Self {
        AdState { ..other.clone() }
    }
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
            .exec()
            .await
            .unwrap()
    }
    pub async fn fetch_creatives(
        client: Arc<PrismaClient>,
        last_updated_at: DateTime<FixedOffset>,
    ) -> Vec<creative::Data> {
        client
            .creative()
            .find_many(vec![creative::updated_at::gt(last_updated_at)])
            .order_by(creative::updated_at::order(Direction::Desc))
            .exec()
            .await
            .unwrap()
    }
    pub async fn fetch_contents(
        client: Arc<PrismaClient>,
        last_updated_at: DateTime<FixedOffset>,
    ) -> Vec<content::Data> {
        client
            .content()
            .find_many(vec![content::updated_at::gt(last_updated_at)])
            .order_by(content::updated_at::order(Direction::Desc))
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
    pub fn update_creatives(&mut self, new_creatives: &Vec<creative::Data>) -> () {
        let creatives = &mut self.creatives;
        for latest_updated_creative in new_creatives.first() {
            let update_info = &mut self.update_info;
            update_info.creatives = latest_updated_creative.updated_at;
        }
        for creative in new_creatives {
            creatives
                .entry(creative.ad_group_id.clone())
                .or_insert_with(|| HashMap::new())
                .entry(creative.id.clone())
                .or_insert_with(|| creative.clone());
        }
    }
    pub fn update_contents(&mut self, new_contents: &Vec<content::Data>) -> () {
        let contents = &mut self.contents;
        for latest_updated_content in new_contents.first() {
            let update_info = &mut self.update_info;
            update_info.contents = latest_updated_content.updated_at;
        }
        for content in new_contents {
            contents.insert(content.id.clone(), content.clone());
        }
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
    pub async fn fetch_and_update_creatives(
        &mut self,
        client: Arc<PrismaClient>,
        last_updated_at: Option<DateTime<FixedOffset>>,
    ) -> () {
        let last_updated_at_value = last_updated_at.unwrap_or(self.update_info.creatives);
        let new_creatives = &Self::fetch_creatives(client, last_updated_at_value).await;
        println!("[new_creatives]: {:?}", new_creatives.len());
        self.update_creatives(new_creatives);
    }
    pub async fn fetch_and_update_contents(
        &mut self,
        client: Arc<PrismaClient>,
        last_updated_at: Option<DateTime<FixedOffset>>,
    ) -> () {
        let last_updated_at_value = last_updated_at.unwrap_or(self.update_info.contents);
        let new_contents = &Self::fetch_contents(client, last_updated_at_value).await;
        println!("[new_contents]: {:?}", new_contents.len());
        self.update_contents(new_contents);
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
        self.fetch_and_update_creatives(client.clone(), None).await;
        self.fetch_and_update_contents(client.clone(), None).await;
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
            self.filter_index.non_filter_ids.iter(),
        );

        SearchResult {
            matched_ads,
            non_filter_ads,
        }
    }
    fn build_placement_tree(
        &self,
        meta_tree: &HashMap<String, HashMap<String, Vec<ad_group::Data>>>,
    ) -> Vec<placement::Data> {
        let mut ads = Vec::<placement::Data>::new();
        let placements = &self.placements;
        let campaigns = &self.campaigns;

        for (placement_id, campaign_tree) in meta_tree {
            for placement in placements.get(placement_id) {
                let mut new_campaigns = Vec::new();
                for (campaign_id, ad_groups) in campaign_tree.iter() {
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
        let mut tree = HashMap::new();

        let placements = &self.placements;
        let campaigns = &self.campaigns;
        let ad_groups = &self.ad_groups;
        let creatives = &self.creatives;
        let contents = &self.contents;

        let mut new_ad_groups = Vec::new();

        for id in ids {
            for ad_group in ad_groups.get(id) {
                let mut new_creatives = Vec::new();
                let empty = HashMap::new();
                let creatives_in_ad_group = creatives.get(&ad_group.id.clone()).unwrap_or(&empty);
                for (_creative_id, creative) in creatives_in_ad_group.iter() {
                    for content in contents.get(&creative.content_id.clone()) {
                        new_creatives.push(creative::Data {
                            content: Some(Box::new(content.clone())),
                            ..creative.clone()
                        });
                    }
                }
                new_ad_groups.push(ad_group::Data {
                    creatives: Some(new_creatives),
                    ..ad_group.clone()
                })
            }
        }
        for ad_group in new_ad_groups.iter() {
            for campaign in campaigns.get(&ad_group.campaign_id) {
                for placement in placements.get(&campaign.placement_id) {
                    for current_placement_group_id in placement.placement_group_id.iter() {
                        if current_placement_group_id == placement_group_id {
                            tree.entry(placement.id.clone())
                                .or_insert_with(|| HashMap::new())
                                .entry(campaign.id.clone())
                                .or_insert_with(|| Vec::new())
                                .push(ad_group.clone())
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
        let meta_tree = self.merge_ids_with_ad_metas(placement_group_id, ids);

        self.build_placement_tree(&meta_tree)
    }
}
