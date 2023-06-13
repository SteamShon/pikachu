use common::{
    db::{integration, placement, provider, creative},
    types::{UserInfo, Stat, CreativeWithContent},
    util::is_active_provider,
};
use filter::index::FilterIndex;
use std::collections::HashMap;

use crate::{function::Function, local_creative_fetcher::LocalCreativeFetcher};

#[derive(Debug, Clone)]
pub struct Integrations {
    pub integrations: HashMap<String, HashMap<String, integration::Data>>,
    pub providers: HashMap<String, provider::Data>,
    pub functions: HashMap<String, Function>,
}
impl Default for Integrations {
    fn default() -> Self {
        Self {
            integrations: Default::default(),
            providers: Default::default(),
            functions: Default::default(),
        }
    }
}
impl Integrations {
    pub async fn update_providers(&mut self, new_providers: &Vec<provider::Data>) -> () {
        let providers = &mut self.providers;

        for provider in new_providers {
            if is_active_provider(provider) {
                providers.insert(provider.id.clone(), provider.clone());
            }
        }
    }

    pub async fn update_integrations(
        &mut self, 
        new_placements: &Vec<placement::Data>
    ) -> () {
        let integrations = &mut self.integrations;
        let functions = &mut self.functions;

        for placement in new_placements {
            if let Some(placement_integrations) = &placement.integrations {
                let inner = integrations
                    .entry(placement.id.clone())
                    .or_insert_with(|| HashMap::new());
                for integration in placement_integrations {
                    if let Some(function) = Function::new(integration).await {
                        functions.insert(integration.id.clone(), function.clone());
                    }

                    inner.insert(integration.id.clone(), integration.clone());
                }
            }
        }
    }
    pub async fn new(
        placements: &Vec<placement::Data>, 
        providers: &Vec<provider::Data>,
    ) -> Integrations {
        let mut integrations = Integrations {
            integrations: Default::default(),
            providers: Default::default(),
            functions: Default::default(),
        };

        integrations.update_integrations(placements).await;
        integrations.update_providers(providers).await;
        // println!("{:?}", integrations);

        integrations
    }
    fn get_integration(&self, placement_id: &str, is_valid: fn(&integration::Data) -> bool) -> Option<&Function> {
        let integrations = self.integrations.get(placement_id)?;
        let user_feature_integration = integrations
            .values()
            .find(|i| is_valid(*i))?;
        self.functions.get(&user_feature_integration.id)
    }
    pub fn is_user_feature_integration(integration: &integration::Data) -> bool {
        let table_partition = integration
            .details
            .get("cubeHistoryId")
            .map(|v| v.as_str().unwrap())
            .is_some();
        integration
            .provider()
            .map(|provider| {
                provider.details.get("DATABASE_URL").is_some()
                    && table_partition
                    && provider.provide == "USER_FEATURE"
            })
            .unwrap_or(false)
    }
    
    fn get_user_feature_function(&self, placement_id: &str) -> Option<&Function> {
        self.get_integration(placement_id, Self::is_user_feature_integration)
    }

    pub async fn user_features(&self, placement_id: &str, user_id: &str) -> Option<UserInfo> {
        match self.get_user_feature_function(placement_id)? {
            Function::UserFeature { function } => function.apply(user_id).await,
            _ => None,
        }
    }

    pub fn is_sms_sender_integration(integration: &integration::Data) -> bool {
        integration
            .provider()
            .map(|provider| {
                integration.details.get("uri").is_some()
                    && provider.provide == "SMS"
                    && provider.details.get("apiKey").is_some()
                    && provider.details.get("apiSecret").is_some()
            })
            .unwrap_or(false)
    }
    fn get_sms_sender_function(&self, placement_id: &str) -> Option<&Function> {
        self.get_integration(placement_id, Self::is_sms_sender_integration)
    }

    pub async fn send_sms(
        &self,
        placement_id: &str,
        payload: &serde_json::Value,
    ) -> Option<reqwest::Response> {
        match self.get_sms_sender_function(placement_id)? {
            Function::SMSSender { function } => function.apply(payload).await.ok(),
            _ => None,
        }
    }
    pub fn is_creative_fetcher(integration: &integration::Data) -> bool {
        integration
            .provider()
            .map(|provider| {
                    provider.provide == "API"
            })
            .unwrap_or(false)
    }
    fn get_creative_fetcher_function(&self, placement_id: &str) -> Option<&Function> {
        self.get_integration(placement_id, Self::is_creative_fetcher)
    }
    pub async fn fetch_non_filter_creatives<'a: 'b, 'b>(
        &'b self,
        filter_index: &'a HashMap<String, FilterIndex>,
        ad_group_creatives: &'a HashMap<String, HashMap<String, creative::Data>>,
        placement_id: &str, 
    ) -> Option<HashMap<String, &'a HashMap<String, creative::Data>> > {
        let index = filter_index.get(placement_id)?;

        Some(LocalCreativeFetcher::ad_group_ids_to_creatives(
            &index.non_filter_ids, 
            ad_group_creatives
        ))
    }
    pub async fn fetch_creatives<'a: 'b, 'b>(
        &'b self,
        filter_index: &'a HashMap<String, FilterIndex>,
        ad_group_creatives: &'a HashMap<String, HashMap<String, creative::Data>>,
        placement_id: &str, 
        user_info: &UserInfo,
    ) -> Option<HashMap<String, &'a HashMap<String, creative::Data>> > {
        match self.get_creative_fetcher_function(placement_id)? {
            Function::LocalCreativeFetcher { function } => 
                function.apply(filter_index, ad_group_creatives, placement_id, user_info).await,
            _ => None,
        }
    }
    pub fn is_ranker_integration(integration: &integration::Data) -> bool {
        integration
            .provider()
            .map(|provider| {
                provider.provide == "RANKER"
            })
            .unwrap_or(false)
    }
    fn get_ranker_function(&self, placement_id: &str) -> Option<&Function> {
        self.get_integration(placement_id, Self::is_ranker_integration)
    }

    pub fn rank<'a>(
        &'a self,
        placement_id: &str,
        creatives_stat: &'a HashMap<String, Stat>,
        candidates: &'a Vec<CreativeWithContent<'a>>,
        k: usize,
    ) -> Vec<(&CreativeWithContent<'a>, f32)> {
        match self.get_ranker_function(placement_id) {
            Some(Function::ThompsonSamplingRanker { function }) => {
                function.apply(creatives_stat, candidates, k)
            }
            _ => {
                let mut top_candidates = Vec::new();
                for candidate in candidates {
                    top_candidates.push((candidate, 0.0));
                }
                top_candidates
            }
        }
    }
}
