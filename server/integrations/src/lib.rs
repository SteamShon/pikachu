pub mod user_feature;
pub mod function;
pub mod sms_sender;

use std::{collections::HashMap, sync::Arc};
use common::{db::{integration, provider, placement, self, PrismaClient}, util::is_active_provider, types::UserInfo};
use async_trait::async_trait;
use function::Function;
use prisma_client_rust::{raw, QueryError};
use serde::Deserialize;
use futures::future::join_all;
use user_feature::UserFeatureDatabase;



#[derive(Debug, Clone)]
pub struct Integrations {
    pub integrations: HashMap<String, HashMap<String, integration::Data>>,
    pub providers: HashMap<String, provider::Data>,
    pub functions: HashMap<String, Function>
}
impl Default for Integrations {
    fn default() -> Self {
        Self { 
            integrations: Default::default(), 
            providers: Default::default(), 
            functions: Default::default() 
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

    pub async fn update_integrations(&mut self, new_placements: &Vec<placement::Data>) -> () {
        let integrations = &mut self.integrations;
        let functions = &mut self.functions;

        for placement in new_placements {
            if let Some(placement_integrations) = &placement.integrations {
                let inner = integrations
                    .entry(placement.id.clone())
                    .or_insert_with(|| HashMap::new());
                for integration in placement_integrations {
                    if let Some(function) = Function::new(integration).await {
                        functions.insert(integration.id.clone(), function);
                    }   

                    inner.insert(integration.id.clone(), integration.clone());
                }
            }
        }
    }
    pub async fn new(placements: &Vec<placement::Data>, providers: &Vec<provider::Data>) -> Self {
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
    pub fn is_user_feature_integration(integration: &integration::Data) -> bool {
        let table_partition = integration.details.get("cubeHistoryId").map(|v| v.as_str().unwrap()).is_some();
        integration
            .provider()
            .map(|provider| 
                provider.details.get("DATABASE_URL").is_some() && 
                table_partition && 
                provider.provide == "USER_FEATURE" 
        )
            .unwrap_or(false)
    }
    
    fn get_user_feature_function(&self, placement_id: &str) -> Option<&Function> {
        let integrations = self.integrations.get(placement_id)?;
        let user_feature_integration = 
            integrations.values().find(|i| Self::is_user_feature_integration(*i))?;
        self.functions.get(&user_feature_integration.id)        
    }

    pub async fn user_features(&self, placement_id: &str, user_id: &str) -> Option<UserInfo> {
        match self.get_user_feature_function(placement_id)? {
            Function::UserFeature { function } => function.apply(user_id).await,
            _ => None
        }
    }
    
    pub fn is_sms_sender_integration(integration: &integration::Data) -> bool {
        integration
            .provider()
            .map(|provider| 
                integration.details.get("uri").is_some() &&
                provider.provide == "SMS" &&
                provider.details.get("apiKey").is_some() && 
                provider.details.get("apiSecret").is_some()
        )
            .unwrap_or(false)
    }
    fn get_sms_sender_function(&self, placement_id: &str) -> Option<&Function> {
        let integrations = self.integrations.get(placement_id)?;
        println!("[Total Integrations]: {:?}", integrations.len());

        let integration = 
            integrations.values().find(|i| {
                let is_valid = Self::is_sms_sender_integration(*i);
                println!("{:?}: {:?}", i, is_valid);
                is_valid
        })?;

        println!("[Integration]: {:?}", integration);
        self.functions.get(&integration.id)        
    }

    pub async fn send_sms(&self, placement_id: &str, payload: &serde_json::Value) -> Option<reqwest::Response> {
        match self.get_sms_sender_function(placement_id)? {
            Function::SMSSender { function } => {
                function.apply(payload).await.ok()
            },
            _ => None
        }
    }
}
