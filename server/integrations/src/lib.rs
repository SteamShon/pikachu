pub mod user_feature;

use std::{collections::HashMap, sync::Arc};
use common::{db::{integration, provider, placement, self, PrismaClient}, util::is_active_provider, types::UserInfo};
use async_trait::async_trait;
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
    
}

#[derive(Debug, Clone)]
pub enum Function {
    UserFeature { function: UserFeatureDatabase },
}
impl Function {
    pub async fn new(integration: &integration::Data) -> Option<Self> {
        let is_user_feature_integration = 
            Integrations::is_user_feature_integration(integration);

        if !is_user_feature_integration {
            return None
        } else {
            let database_url = integration.provider().unwrap().details.get("DATABASE_URL").map(|v| v.as_str().unwrap())?;
            let table_partition = integration.details.get("cubeHistoryId").map(|v| v.as_str().unwrap())?;
            let client = Arc::new(db::new_client_with_url(database_url).await.ok()?);
            let function = UserFeatureDatabase {
                integration: integration.clone(),
                client: client,
                database_url: database_url.to_string(),
                table_partition: table_partition.to_string()
            };
            println!("Function: {:?}", function);
            return Some(Function::UserFeature { function })
        }
    }
}
