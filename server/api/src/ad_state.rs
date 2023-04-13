use crate::db::{
    ad_group, campaign, content, content_type, creative, integration, placement, service,
    service_config, PrismaClient,
};
use common::db::user_feature;
use filter::filter::{TargetFilter, UserInfo};
use filter::filterable::Filterable;
use filter::index::FilterIndex;
use futures::future::join_all;
use prisma_client_rust::chrono::{DateTime, FixedOffset};
use prisma_client_rust::{raw, Direction, QueryError};
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

pub struct AdGroup {
    data: ad_group::Data,
}

impl Filterable for AdGroup {
    fn id(&self) -> String {
        String::from(&self.data.id)
    }

    fn filter(&self) -> Option<TargetFilter> {
        match &self.data.filter {
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
    pub content_types: DateTime<FixedOffset>,
    pub integrations: DateTime<FixedOffset>,
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
            content_types: Default::default(),
            integrations: Default::default(),
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
    pub content_types: HashMap<String, content_type::Data>,
    pub integrations: HashMap<String, HashMap<String, integration::Data>>,
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
            content_types: Default::default(),
            integrations: Default::default(),
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
    pub async fn fetch_content_types(
        client: Arc<PrismaClient>,
        last_updated_at: DateTime<FixedOffset>,
    ) -> Vec<content_type::Data> {
        client
            .content_type()
            .find_many(vec![content_type::updated_at::gt(last_updated_at)])
            .order_by(content_type::updated_at::order(Direction::Desc))
            .with(content_type::content_type_info::fetch())
            .exec()
            .await
            .unwrap()
    }
    pub async fn fetch_integrations(
        client: Arc<PrismaClient>,
        last_updated_at: DateTime<FixedOffset>,
    ) -> Vec<integration::Data> {
        client
            .integration()
            .find_many(vec![integration::updated_at::gt(last_updated_at)])
            .order_by(integration::updated_at::order(Direction::Desc))
            .with(integration::integration_info::fetch())
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
                    ad_groups_to_insert.push(AdGroup {
                        data: ad_group.clone(),
                    });
                } else {
                    ad_groups_to_delete.push(AdGroup {
                        data: ad_group.clone(),
                    });
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
    pub fn update_content_types(&mut self, new_content_types: &Vec<content_type::Data>) -> () {
        let content_types = &mut self.content_types;
        if let Some(latest_updated_content_type) = new_content_types.first() {
            let update_info = &mut self.update_info;
            update_info.content_types = latest_updated_content_type.updated_at;
        }
        for content_type in new_content_types {
            content_types.insert(content_type.id.clone(), content_type.clone());
        }
    }
    pub fn update_integrations(&mut self, new_integrations: &Vec<integration::Data>) -> () {
        let integrations = &mut self.integrations;
        if let Some(latest_updated_integration) = new_integrations.first() {
            let update_info = &mut self.update_info;
            update_info.integrations = latest_updated_integration.updated_at;
        }
        for integration in new_integrations {
            integrations
                .entry(integration.placement_id.clone())
                .or_insert_with(|| HashMap::new())
                .insert(integration.id.clone(), integration.clone());
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
    pub async fn fetch_and_update_content_types(
        &mut self,
        client: Arc<PrismaClient>,
        last_updated_at: Option<DateTime<FixedOffset>>,
    ) -> () {
        let last_updated_at_value = last_updated_at.unwrap_or(self.update_info.content_types);
        let new_content_types = &Self::fetch_content_types(client, last_updated_at_value).await;
        println!("[new_content_typess]: {:?}", new_content_types.len());
        self.update_content_types(new_content_types);
    }
    pub async fn fetch_and_update_integrations(
        &mut self,
        client: Arc<PrismaClient>,
        last_updated_at: Option<DateTime<FixedOffset>>,
    ) -> () {
        let last_updated_at_value = last_updated_at.unwrap_or(self.update_info.integrations);
        let new_integrations = &Self::fetch_integrations(client, last_updated_at_value).await;
        println!("[new_integrations]: {:?}", new_integrations.len());
        self.update_integrations(new_integrations);
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
        self.fetch_and_update_content_types(client.clone(), None)
            .await;
        self.fetch_and_update_integrations(client.clone(), None)
            .await;

        println!("{:?}", self.filter_index);
    }
    fn json_value_to_string(value: &serde_json::Value) -> Option<String> {
        match value {
            serde_json::Value::Object(_) => None,
            serde_json::Value::Array(_) => None,
            serde_json::Value::Null => Some(value.to_string()),
            serde_json::Value::Bool(_) => Some(value.to_string()),
            serde_json::Value::Number(_) => Some(value.to_string()),
            serde_json::Value::String(v) => Some(v.clone()),
        }
    }
    fn parse_user_info(value: &serde_json::Value) -> Option<UserInfo> {
        let mut user_info = HashMap::new();
        for (k, v) in value.as_object()?.iter() {
            let mut items = HashSet::new();

            match v.as_array() {
                Some(values) => {
                    for item in values {
                        if let Some(s) = Self::json_value_to_string(item) {
                            items.insert(s);
                        }
                    }
                }
                None => {
                    if let Some(s) = Self::json_value_to_string(v) {
                        items.insert(s);
                    }
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
    fn is_active_content_type(content_type: &content_type::Data) -> bool {
        content_type.status.to_lowercase() == "published"
    }
    fn is_active_integration(integration: &integration::Data) -> bool {
        integration.status.to_lowercase() == "published"
    }
    pub async fn fetch_user_info(
        &self,
        client: Arc<PrismaClient>,
        placement_id: &str,
        user_id: &str,
    ) -> Option<UserInfo> {
        let queries = self.generate_user_feature_sqls(placement_id, user_id)?;
        let futures = join_all(queries.into_iter().map(|query| {
            let client = &client;
            async move {
                let user_features: Result<Vec<user_feature::Data>, QueryError> =
                    client._query_raw(query).exec().await;

                user_features
            }
        }))
        .await;

        let mut user_info = UserInfo::new();
        for future in futures {
            match future {
                Ok(user_features) => {
                    for user_feature in user_features {
                        if let Some(kvs) = Self::parse_user_info(&user_feature.feature) {
                            for (k, v) in kvs {
                                user_info.insert(k, v);
                            }
                        }
                    }
                }
                Err(e) => println!("Got an error: {}", e),
            }
        }
        Some(user_info)
    }

    pub fn generate_user_feature_sqls(
        &self,
        placement_id: &str,
        user_id: &str,
    ) -> Option<Vec<prisma_client_rust::Raw>> {
        let mut queries = Vec::new();
        let integrations = self.integrations.get(placement_id)?;
        for (_integration_id, integration) in integrations {
            if Self::is_active_integration(integration) && integration.r#type == "DB" {
                if let Some(integration_info) = &integration.integration_info {
                    if let Some(info) = integration_info {
                        if let Some(stored_sql) = info.details.get("SQL") {
                            if let Some(sql) = stored_sql.as_str() {
                                let sql_with_param = sql.replace("{userId}", user_id);
                                let query = raw!(&sql_with_param);
                                queries.push(query);
                            }
                        }
                    }
                }
            }
        }
        Some(queries)
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
        let content_types = &self.content_types;

        for (placement_id, campaign_tree) in meta_tree {
            if let Some(placement) = placements.get(placement_id) {
                if let Some(content_type_id) = &placement.content_type_id {
                    if let Some(content_type) = content_types.get(content_type_id) {
                        if Self::is_active_content_type(&content_type) {
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
                                content_type: Some(Some(Box::new(content_type.clone()))),
                                ..placement.clone()
                            });
                        }
                    }
                }
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
                        && placement.content_type_id.is_some()
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
