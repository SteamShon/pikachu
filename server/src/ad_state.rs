use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use crate::db::{
    ad_group, campaign, content, creative, placement, service, service_config, PrismaClient,
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
    pub placements: HashMap<String, placement::Data>,
    pub campaigns: HashMap<String, campaign::Data>,
    pub ad_groups: HashMap<String, ad_group::Data>,
    pub creatives: HashMap<String, HashMap<String, creative::Data>>,
    pub contents: HashMap<String, content::Data>,
    pub update_info: UpdateInfo,
    pub filter_index: HashMap<String, FilterIndex>,
}
impl Default for AdState {
    fn default() -> Self {
        Self {
            services: Default::default(),
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
    fn get_campaign(&self, ad_group: &ad_group::Data) -> Option<&campaign::Data> {
        self.campaigns.get(&ad_group.campaign_id)
    }
    fn get_placement(&self, ad_group: &ad_group::Data) -> Option<&placement::Data> {
        self.placements
            .get(&self.get_campaign(ad_group)?.placement_id)
    }
    fn get_service(&self, ad_group: &ad_group::Data) -> Option<&service::Data> {
        let service_id = &self.get_placement(ad_group)?.service_id;
        match service_id {
            None => None,
            Some(id) => self.services.get(id),
        }
    }
    pub async fn fetch_services(
        client: Arc<PrismaClient>,
        last_updated_at: DateTime<FixedOffset>,
    ) -> Vec<service::Data> {
        client
            .service()
            .find_many(vec![service::updated_at::gt(last_updated_at)])
            .with(service::service_config::fetch().with(service_config::cubes::fetch(vec![])))
            .order_by(service::updated_at::order(Direction::Desc))
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
        if let Some(latest_updated_service) = new_services.first() {
            let update_info = &mut self.update_info;
            update_info.services = latest_updated_service.updated_at;
        }
        for service in new_services {
            services.insert(service.id.clone(), service.clone());
        }
    }
    pub fn update_placements(&mut self, new_placements: &Vec<placement::Data>) -> () {
        let placements = &mut self.placements;
        if let Some(latest_updated_placement) = new_placements.first() {
            let update_info = &mut self.update_info;
            update_info.placements = latest_updated_placement.updated_at;
        }
        for placement in new_placements {
            placements.insert(placement.id.clone(), placement.clone());
        }
    }
    pub fn update_campaigns(&mut self, new_campaigns: &Vec<campaign::Data>) -> () {
        let campaigns = &mut self.campaigns;
        if let Some(latest_updated_campaign) = new_campaigns.first() {
            let update_info = &mut self.update_info;
            update_info.campaigns = latest_updated_campaign.updated_at;
        }
        for campaign in new_campaigns {
            campaigns.insert(campaign.id.clone(), campaign.clone());
        }
    }
    fn ad_group_grouped_by_service(
        &self,
        ad_groups: &Vec<ad_group::Data>,
    ) -> HashMap<String, Vec<ad_group::Data>> {
        let mut service_ad_groups = HashMap::new();
        for ad_group in ad_groups {
            if let Some(service) = self.get_service(ad_group) {
                service_ad_groups
                    .entry(service.id.clone())
                    .or_insert_with(|| Vec::new())
                    .push(ad_group.clone());
            }
        }
        service_ad_groups
    }
    pub fn update_ad_groups(&mut self, new_ad_groups: &Vec<ad_group::Data>) -> () {
        let ad_groups = &mut self.ad_groups;
        if let Some(latest_updated_ad_group) = new_ad_groups.first() {
            let update_info = &mut self.update_info;
            update_info.ad_groups = latest_updated_ad_group.updated_at;
        }
        for ad_group in new_ad_groups {
            ad_groups.insert(ad_group.id.clone(), ad_group.clone());
        }
        let service_ad_groups = self.ad_group_grouped_by_service(new_ad_groups);
        for (service_id, ad_groups) in service_ad_groups.iter() {
            let index = self
                .filter_index
                .entry(service_id.clone())
                .or_insert_with(|| FilterIndex::default());

            let mut ad_groups_to_insert = Vec::new();
            let mut ad_groups_to_delete = Vec::new();

            for ad_group in ad_groups {
                if Self::is_active_ad_group(ad_group) {
                    ad_groups_to_insert.push(ad_group.clone());
                } else {
                    ad_groups_to_delete.push(ad_group.clone());
                }
            }

            index.update(&ad_groups_to_insert, &ad_groups_to_delete);
        }
    }
    pub fn update_creatives(&mut self, new_creatives: &Vec<creative::Data>) -> () {
        let creatives = &mut self.creatives;
        if let Some(latest_updated_creative) = new_creatives.first() {
            let update_info = &mut self.update_info;
            update_info.creatives = latest_updated_creative.updated_at;
        }
        for creative in new_creatives {
            creatives
                .entry(creative.ad_group_id.clone())
                .or_insert_with(|| HashMap::new())
                .insert(creative.id.clone(), creative.clone());
        }
    }
    pub fn update_contents(&mut self, new_contents: &Vec<content::Data>) -> () {
        let contents = &mut self.contents;
        if let Some(latest_updated_content) = new_contents.first() {
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
                if let Some(str) = item.as_str() {
                    items.insert(String::from(str));
                }
            }
            user_info.insert(k.clone(), items);
        }

        Some(user_info)
    }
    fn is_active_placement(placement: &placement::Data) -> bool {
        placement.status.to_lowercase() == "published"
    }
    fn is_active_campaign(campaign: &campaign::Data) -> bool {
        campaign.status.to_lowercase() == "published"
    }
    fn is_active_ad_group(ad_group: &ad_group::Data) -> bool {
        ad_group.status.to_lowercase() == "published"
    }
    fn is_active_creative(creative: &creative::Data) -> bool {
        creative.status.to_lowercase() == "published"
    }
    fn is_active_content(content: &content::Data) -> bool {
        content.status.to_lowercase() == "published"
    }
    pub fn search(
        &self,
        service_id: &str,
        placement_id: &str,
        user_info_json: &serde_json::Value,
    ) -> SearchResult {
        let user_info = Self::parse_user_info(user_info_json).unwrap();
        let matched_ids = match self.filter_index.get(service_id) {
            Some(index) => index.search(&user_info),
            None => HashSet::new(),
        };
        println!("{:?}", self.filter_index.get(service_id));
        println!("[ids]: {:?}", matched_ids);

        let matched_ads = self.transform_ids_to_ads_grouped(placement_id, matched_ids.iter());
        let non_filter_ads = match self.filter_index.get(service_id) {
            None => Vec::new(),
            Some(index) => {
                self.transform_ids_to_ads_grouped(placement_id, index.non_filter_ids.iter())
            }
        };

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
            if let Some(placement) = placements.get(placement_id) {
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
        placement_id: &str,
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
            if let Some(ad_group) = ad_groups.get(id) {
                let mut new_creatives = Vec::new();
                let empty = HashMap::new();

                let creatives_in_ad_group = creatives.get(&ad_group.id.clone()).unwrap_or(&empty);
                for (_creative_id, creative) in creatives_in_ad_group.iter() {
                    if let Some(content) = contents.get(&creative.content_id.clone()) {
                        if Self::is_active_creative(creative) && Self::is_active_content(content) {
                            new_creatives.push(creative::Data {
                                content: Some(Box::new(content.clone())),
                                ..creative.clone()
                            });
                        }
                    }
                }
                new_ad_groups.push(ad_group::Data {
                    creatives: Some(new_creatives),
                    ..ad_group.clone()
                })
            }
        }
        for ad_group in new_ad_groups.iter() {
            if let Some(campaign) = campaigns.get(&ad_group.campaign_id) {
                if let Some(placement) = placements.get(&campaign.placement_id) {
                    if placement.id == placement_id
                        && Self::is_active_campaign(campaign)
                        && Self::is_active_placement(placement)
                    {
                        tree.entry(placement.id.clone())
                            .or_insert_with(|| HashMap::new())
                            .entry(campaign.id.clone())
                            .or_insert_with(|| Vec::new())
                            .push(ad_group.clone())
                    }
                }
            }
        }

        tree
    }

    fn transform_ids_to_ads_grouped<'a, I>(
        &self,
        placement_id: &str,
        ids: I,
    ) -> Vec<placement::Data>
    where
        I: Iterator<Item = &'a String>,
    {
        let meta_tree = self.merge_ids_with_ad_metas(placement_id, ids);

        self.build_placement_tree(&meta_tree)
    }
}

#[cfg(test)]
#[path = "./ad_state_test.rs"]
mod ad_state_test;
