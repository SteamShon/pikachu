use common::db::{
    ad_group, ad_set, campaign, content, content_type, creative, placement, segment, service,
};
use common::types::*;
use common::util::*;

use filter::filter::TargetFilter;
use filter::filterable::Filterable;
use filter::index::FilterIndex;
use filter::serde as TargetFilterSerde;
use integrations::integrations::Integrations;
use prisma_client_rust::chrono::{DateTime, FixedOffset};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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

                TargetFilterSerde::from_jsonlogic(&value)
            }
        }
    }
}

pub struct AdSet {
    pub data: ad_set::Data,
}

impl Filterable for AdSet {
    fn id(&self) -> String {
        String::from(&self.data.id)
    }

    fn filter(&self) -> Option<TargetFilter> {
        match &self.data.segment().ok()? {
            None => None,
            Some(segment) => match &segment.r#where {
                None => None,
                Some(s) => {
                    let value: serde_json::Value = serde_json::from_str(s).ok()?;

                    TargetFilterSerde::from_jsonlogic(&value)
                }
            },
        }
    }
}
#[derive(Debug, Clone, Deserialize)]
pub struct CreativeFeedback {
    ad_group_id: String,
    creative_id: String,
    stat: Stat,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AdSetFeedback {
    ad_set_id: String,
    stat: Stat,
}

#[derive(Serialize)]
pub struct SearchResult<'a> {
    pub matched_ads: Vec<PlacementCampaigns<'a>>,
    pub non_filter_ads: Vec<PlacementCampaigns<'a>>,
}

impl<'a> Default for SearchResult<'a> {
    fn default() -> Self {
        Self {
            matched_ads: Default::default(),
            non_filter_ads: Default::default(),
        }
    }
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdSetContent<'a> {
    pub ad_set: &'a ad_set::Data,
    pub content: &'a content::Data,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdSetSearchResult<'a> {
    pub content_type: &'a content_type::Data,
    pub ad_sets: Vec<AdSetContent<'a>>,
}

#[derive(Debug, Clone)]
pub struct UpdateInfo {
    pub services: DateTime<FixedOffset>,
    pub placements: DateTime<FixedOffset>,
    pub campaigns: DateTime<FixedOffset>,
    pub ad_groups: DateTime<FixedOffset>,
    pub creatives: DateTime<FixedOffset>,
    pub contents: DateTime<FixedOffset>,
    pub ad_sets: DateTime<FixedOffset>,
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
            ad_sets: Default::default(),
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
    pub segments: HashMap<String, segment::Data>,
    pub ad_sets: HashMap<String, ad_set::Data>,
    pub update_info: UpdateInfo,
    pub filter_index: HashMap<String, FilterIndex>,
    pub ad_set_index: HashMap<String, FilterIndex>,
    //TODO: Make Different implementation for Ranker trait per placement.
    // pub ranker: DefaultRanker<Creative>,
    pub creatives_stat: HashMap<String, Stat>,
    pub ad_sets_stat: HashMap<String, Stat>,
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
            segments: Default::default(),
            ad_sets: Default::default(),
            update_info: Default::default(),
            filter_index: Default::default(),
            ad_set_index: Default::default(),
            // ranker: Default::default(),
            creatives_stat: Default::default(),
            ad_sets_stat: Default::default(),
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
    pub fn get_ad_group(&self, ad_group_id: &str) -> Option<&ad_group::Data> {
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
    pub async fn search_ad_sets(
        &self,
        _service_id: &str,
        placement_id: &str,
        user_info_json: &serde_json::Value,
        top_k: Option<usize>,
    ) -> Option<AdSetSearchResult> {
        let mut ad_set_contents = Vec::new();
        let placement = self.placements.get(placement_id)?;
        let content_type = self.content_types.get(&placement.content_type_id)?;

        let user_info = parse_user_info(user_info_json).unwrap();

        let ad_sets = self
            .integrations
            .fetch_ad_sets(&self.ad_set_index, &self.ad_sets, placement_id, &user_info)
            .await
            .unwrap_or(Vec::new());
        let top_ad_sets = self.integrations.rank_ad_sets(
            placement_id,
            &self.ad_sets_stat,
            ad_sets,
            top_k.unwrap_or(1),
        );

        for (ad_set, _score) in top_ad_sets {
            if let Some(content) = self.contents.get(&ad_set.content_id) {
                if is_active_content(content) {
                    ad_set_contents.push(AdSetContent { ad_set, content });
                }
            }
        }

        if !is_active_placement(&placement) || !is_active_content_type(&content_type) {
            None
        } else {
            Some(AdSetSearchResult {
                content_type,
                ad_sets: ad_set_contents,
            })
        }
    }
    pub async fn search(
        &self,
        _service_id: &str,
        placement_id: &str,
        user_info_json: &serde_json::Value,
        top_k: Option<usize>,
    ) -> SearchResult {
        let user_info = parse_user_info(user_info_json).unwrap();

        let creatives_map = self
            .integrations
            .fetch_creatives(
                &self.filter_index,
                &self.creatives,
                placement_id,
                &user_info,
            )
            .await
            .unwrap_or(HashMap::new());

        let creatives = self.ad_group_ids_to_creatives_with_contents(creatives_map);
        let ad_group_creatives = self.ad_group_creatives(placement_id, creatives, top_k);
        let campaign_ad_groups = self.campaign_ad_groups(ad_group_creatives);
        let matched_ads = self.placement_campaigns(campaign_ad_groups);

        SearchResult {
            matched_ads,
            non_filter_ads: Vec::new(),
        }
    }

    fn ad_group_ids_to_creatives_with_contents<'a>(
        &'a self,
        ad_group_id_creatives: HashMap<&'a str, &'a HashMap<String, creative::Data>>,
    ) -> Vec<CreativeWithContent<'a>> {
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
                        let creative_with_content = CreativeWithContent { creative, content };
                        creatives.push(creative_with_content);
                    }
                }
            }
        }
        creatives
    }

    fn ad_group_creatives<'a>(
        &'a self,
        placement_id: &str,
        creatives: Vec<CreativeWithContent<'a>>,
        top_k: Option<usize>,
    ) -> Vec<AdGroupCreatives<'a>> {
        let mut aggr = Vec::new();
        let mut ad_group_id_creatives = HashMap::new();
        // let creatives = self.ad_group_ids_to_creatives_with_contents(result);
        let top_creatives = self.integrations.rank(
            placement_id,
            &self.creatives_stat,
            creatives,
            top_k.unwrap_or(1),
        );

        for (creative_with_content, _score) in top_creatives {
            ad_group_id_creatives
                .entry(creative_with_content.creative.ad_group_id.clone())
                .or_insert_with(|| Vec::new())
                .push(creative_with_content);
        }
        for (ad_group_id, creatives) in ad_group_id_creatives {
            if let Some(ad_group) = self.get_ad_group(&ad_group_id) {
                if is_active_ad_group(ad_group) {
                    aggr.push(AdGroupCreatives {
                        ad_group,
                        creatives,
                    });
                }
            }
        }
        aggr
    }

    fn campaign_ad_groups<'a>(
        &'a self,
        ad_group_creatives_ls: Vec<AdGroupCreatives<'a>>,
    ) -> Vec<CampaignAdGroups<'a>> {
        let mut aggr = Vec::new();
        let mut campaign_id_ad_groups = HashMap::new();

        for ad_group_creatives in ad_group_creatives_ls {
            campaign_id_ad_groups
                .entry(ad_group_creatives.ad_group.campaign_id.clone())
                .or_insert_with(|| Vec::new())
                .push(ad_group_creatives);
        }
        for (campaign_id, ad_groups) in campaign_id_ad_groups {
            if let Some(campaign) = self.campaigns.get(&campaign_id) {
                if is_active_campaign(campaign) {
                    aggr.push(CampaignAdGroups {
                        campaign,
                        ad_groups,
                    });
                }
            }
        }
        aggr
    }
    fn placement_campaigns<'a>(
        &'a self,
        campaign_ad_groups_ls: Vec<CampaignAdGroups<'a>>,
    ) -> Vec<PlacementCampaigns<'a>> {
        let mut aggr = Vec::new();
        let mut placement_id_campaigns = HashMap::new();

        for campaign_ad_groups in campaign_ad_groups_ls {
            placement_id_campaigns
                .entry(campaign_ad_groups.campaign.placement_id.clone())
                .or_insert_with(|| Vec::new())
                .push(campaign_ad_groups);
        }
        for (placement_id, campaigns) in placement_id_campaigns {
            if let Some(placement) = self.placements.get(&placement_id) {
                if is_active_placement(placement) {
                    aggr.push(PlacementCampaigns {
                        placement,
                        campaigns,
                    });
                }
            }
        }
        aggr
    }

    pub fn update_creative_feedback(&mut self, creative_feedbacks: &Vec<CreativeFeedback>) {
        let creatives_stat = &mut self.creatives_stat;
        let creatives = &self.creatives;

        for CreativeFeedback {
            ad_group_id,
            creative_id,
            stat,
        } in creative_feedbacks
        {
            if creatives.contains_key(ad_group_id) {
                creatives_stat
                    .entry(creative_id.clone())
                    .or_insert_with(|| Stat::default())
                    .merge(stat);
            }
        }
    }

    pub fn update_ad_set_feedback(&mut self, ad_set_feedbacks: &Vec<AdSetFeedback>) {
        let ad_sets_stat = &mut self.ad_sets_stat;
        let ad_sets = &self.ad_sets;

        for AdSetFeedback { ad_set_id, stat } in ad_set_feedbacks {
            if ad_sets.contains_key(ad_set_id) {
                ad_sets_stat
                    .entry(ad_set_id.clone())
                    .or_insert_with(|| Stat::default())
                    .merge(stat);
            }
        }
    }

    pub async fn fetch_user_info(&self, placement_id: &str, user_id: &str) -> Option<UserInfo> {
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
        user_info: &UserInfo,
    ) -> Option<HashMap<&str, &HashMap<String, creative::Data>>> {
        self.integrations
            .fetch_creatives(&self.filter_index, &self.creatives, placement_id, user_info)
            .await
    }

    pub async fn fetch_ad_sets(
        &self,
        placement_id: &str,
        user_info: &UserInfo,
    ) -> Option<Vec<&ad_set::Data>> {
        self.integrations
            .fetch_ad_sets(&self.ad_set_index, &self.ad_sets, placement_id, user_info)
            .await
    }
}

#[cfg(test)]
#[path = "./ad_state_test.rs"]
mod ad_state_test;
