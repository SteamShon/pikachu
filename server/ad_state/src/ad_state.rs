use arc_swap::Guard;
use common::types::UserInfo;
use common::db::{
    ad_group, campaign, content, content_type, creative, placement, service,
    PrismaClient, integration,
};
use common::util::{parse_user_info, is_active_content_type, is_active_ad_group, is_active_creative, is_active_content, is_active_placement, is_active_campaign};

use common::db::{user_feature, provider};
use filter::filter::{TargetFilter};
use filter::filterable::Filterable;
use filter::index::FilterIndex;
use futures::future::join_all;
use integrations::integrations::Integrations;
use prisma_client_rust::chrono::{DateTime, FixedOffset};
use prisma_client_rust::{raw,  QueryError};
use serde::{Serialize, Deserialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use ranker::ranker::{Rankable, Ranker, DefaultRanker, Feedback, Stat};

use crate::ad_state_builder::load;

pub struct AdGroup {
    pub data: ad_group::Data,
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
#[derive(Debug, Clone, Deserialize)]
pub struct CreativeFeedback {
    ad_group_id: String,
    creative_id: String,
    stat: Stat,
}

#[derive(Debug, Clone)]
pub struct Creative {
    pub data: creative::Data,
}
impl Rankable for Creative {
    fn ident(&self) -> String {
        self.data.id.to_string()
    }
}
#[derive(Serialize)]
pub struct SearchResult {
    pub matched_ads: Vec<placement::Data>,
    // pub grouped: HashMap<String, HashMap<String, HashMap<String, ad_group::Data>>>,
    pub non_filter_ads: Vec<placement::Data>,
}

impl Default for SearchResult {
    fn default() -> Self {
        Self { matched_ads: Default::default(), non_filter_ads: Default::default() }
    }
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
    pub update_info: UpdateInfo,
    pub filter_index: HashMap<String, FilterIndex>,
    //TODO: Make Different implementation for Ranker trait per placement.
    pub ranker: DefaultRanker<Creative>,
    pub integrations: Integrations,
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
            update_info: Default::default(),
            filter_index: Default::default(),
            ranker: Default::default(),
            integrations: Integrations::default(),
            // clients: Default::default(),
            // functions: Default::default(),
        }
    }
}

impl AdState {
    pub fn from(other: &Self) -> Self {
        AdState { ..other.clone() }
    }
    pub fn get_ad_group(&self, ad_group_id: &String) -> Option<&ad_group::Data> {
        self.ad_groups.get(ad_group_id)
    }
    pub fn get_campaign(&self, ad_group: &ad_group::Data) -> Option<&campaign::Data> {
        self.campaigns.get(&ad_group.campaign_id)
    }
    pub fn get_placement(&self, ad_group: &ad_group::Data) -> Option<&placement::Data> {
        self.placements
            .get(&self.get_campaign(ad_group)?.placement_id)
    }
    

    pub fn init() -> Self {
        AdState::default()
    }
   
    pub fn set_integrations(&mut self, integrations: Integrations) {
        self.integrations = integrations;
    }
    // pub async fn fetch_user_info(
    //     &self,
    //     placement_id: &str,
    //     user_id: &str,
    // ) -> Option<UserInfo> {
    //     let integrations = self.integrations.get(placement_id)?;
    //     let (integration, provider) = self.get_user_feature_integration(integrations)?;
        
    // }

    // fn generate_user_feature_sqls(
    //     &self,
    //     integration: &integration::Data,
    //     user_id: &str,
    // ) -> Option<Vec<prisma_client_rust::Raw>> {
    //     let mut queries = Vec::new();
    //     if let Some(version) = integration.details.get("cubeHistoryId").map(|v| v.as_str().unwrap()) {
    //         let sql = format!(r#"
    //             SELECT  *
    //             FROM    "UserFeature"
    //             WHERE   "cubeHistoryId" = '{}'
    //             AND     "userId" = '{}'
    //         "#, version, user_id);
    //         println!("{:?}", sql);
    //         let query = raw!(&sql);
    //         queries.push(query);
    //     }   
    //     Some(queries)
    // }
    pub async fn search(
        &self,
        _service_id: &str,
        placement_id: &str,
        user_info_json: &serde_json::Value,
        top_k: Option<usize>,
    ) -> SearchResult {
        let user_info = parse_user_info(user_info_json).unwrap();
        
        let creatives = self.integrations.fetch_creatives(
            &self.filter_index, 
            &self.creatives, 
            placement_id, 
            &user_info
        ).await.unwrap_or(HashMap::new());
        
        let matched_ads = self.build_placement_tree(
            &self.merge_ids_with_ad_metas(&user_info, &creatives, top_k)
        );
        
        let non_filter_creatives = self.integrations.fetch_non_filter_creatives(
            &self.filter_index, 
            &self.creatives, 
            placement_id
        ).await.unwrap_or(HashMap::new());
        let non_filter_ads = self.build_placement_tree(
            &self.merge_ids_with_ad_metas(&user_info, &non_filter_creatives, top_k)
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
        let content_types = &self.content_types;

        for (placement_id, campaign_tree) in meta_tree {
            if let Some(placement) = placements.get(placement_id) {
                if let Some(content_type_id) = &placement.content_type_id {
                    if let Some(content_type) = content_types.get(content_type_id) {
                        if is_active_content_type(&content_type) {
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
    fn ad_group_ids_to_creatives_with_contents(
        &self,
        ad_group_id_creatives: &HashMap<String, &HashMap<String, creative::Data>>
    )  -> Vec<Creative> 
    {
        let mut creatives = Vec::new();

        for (ad_group_id, creatives_in_ad_group) in ad_group_id_creatives {
            if let Some(ad_group) = self.get_ad_group(ad_group_id) {
                if !is_active_ad_group(ad_group) {
                    continue;
                }
                for creative in creatives_in_ad_group.values() {
                    if !is_active_creative(creative) {
                        continue;
                    }

                    if let Some(content) = self.contents.get(&creative.content_id) {
                        if !is_active_content(content) {
                            continue;
                        }

                        creatives.push(Creative { data: creative::Data {
                            content: Some(Box::new(content.clone())),
                            ..creative.clone()
                        } });
                    }
                }
            }
            
        }
        
        creatives
    }
    
    fn merge_ids_with_ad_metas(
        &self,
        user_info: &UserInfo,
        result: &HashMap<String, &HashMap<String, creative::Data>>,
        top_k: Option<usize>,
    ) -> HashMap<String, HashMap<String, Vec<ad_group::Data>>>
    {
        let mut ad_group_id_creatives = HashMap::new();
        let creatives = self.ad_group_ids_to_creatives_with_contents(result);
        
        let top_creatives = match top_k {
            Some(k) if creatives.len() < k => 
                self
                .ranker
                .rank(user_info, &creatives, k)
                .iter()
                .map(|(c, _s)| c.clone())
                .collect(),
            _ => creatives
        };
        
        for Creative { data: creative } in top_creatives {
            ad_group_id_creatives
                .entry(creative.ad_group_id.clone())
                .or_insert_with(|| Vec::new())
                .push(creative.clone());
        }

        self.group_by_ad_groups_by_id(ad_group_id_creatives)
    }

    fn group_by_ad_groups_by_id(
        &self, 
        ad_group_id_creatives: HashMap<String, Vec<creative::Data>>, 
    ) -> HashMap<String, HashMap<String, Vec<ad_group::Data>>> {
        let mut tree = HashMap::new();
        for (ad_group_id, creatives) in ad_group_id_creatives {
            if let Some(ad_group) = self.get_ad_group(&ad_group_id) {
                if let Some(campaign) = self.get_campaign(ad_group) {
                    if let Some(placement) = self.get_placement(ad_group) {
                        if is_active_campaign(campaign)
                            && is_active_placement(placement)
                            && placement.content_type_id.is_some()
                        {
                            tree.entry(placement.id.clone())
                                .or_insert_with(|| HashMap::new())
                                .entry(campaign.id.clone())
                                .or_insert_with(|| Vec::new())
                                .push(ad_group::Data {
                                    creatives: Some(creatives),
                                    ..ad_group.clone()
                                } )
                        }
                    }
                }
            }
        }

        tree
    }

    pub fn update_creative_feedback(
        &mut self, 
        creative_feedbacks: &Vec<CreativeFeedback>
    ) {
        let creatives = &self.creatives;
        let mut feedbacks = Vec::<Feedback<Creative>>::new();

        for CreativeFeedback { ad_group_id, creative_id, stat } in creative_feedbacks {
            if let Some(creatives_in_ad_group) = creatives.get(ad_group_id) {
                if let Some(creative) = creatives_in_ad_group.get(creative_id) {
                    let feedback = Feedback { 
                        arm: Creative { data: creative.clone() }, 
                        reward: stat.clone() 
                    };

                    feedbacks.push(feedback);
                }
            }
        }
        
        self.ranker.update(&feedbacks);
    }

    pub async fn fetch_user_info(
        &self,
        placement_id: &str,
        user_id: &str,
    ) -> Option<UserInfo> {
        self.integrations.user_features(placement_id, user_id).await
    }

    pub async fn send_sms(
        &self,
        placement_id: &str,
        payload: &serde_json::Value,
    ) -> Option<reqwest::Response> {
        self.integrations.send_sms(placement_id, payload).await
    }

    pub async fn fetch_creatives(
        &self,
        placement_id: &str,
        user_info: &UserInfo
    ) -> Option<HashMap<String, &HashMap<String, creative::Data>> > {
        self.integrations.fetch_creatives(
            &self.filter_index, 
            &self.creatives, 
            placement_id, 
            user_info
        ).await
    }
}

#[cfg(test)]
#[path = "./ad_state_test.rs"]
mod ad_state_test;
