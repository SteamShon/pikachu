use std::sync::Arc;

use common::db::{integration, self};

use crate::{user_feature::UserFeatureDatabase, Integrations, sms_sender::SmsSender};


#[derive(Debug, Clone)]
pub enum Function {
    UserFeature { function: UserFeatureDatabase },
    SMSSender { function : SmsSender }
}
impl Function {
    pub async fn new(integration: &integration::Data) -> Option<Self> {
        let is_user_feature_integration = 
            Integrations::is_user_feature_integration(integration);
        let is_sms_sender_integration = 
            Integrations::is_sms_sender_integration(integration);
            
        if is_user_feature_integration {
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
        } else if is_sms_sender_integration {
            let api_key = integration.provider().unwrap().details.get("apiKey").map(|v| v.as_str().unwrap())?;
            let api_secret = integration.provider().unwrap().details.get("apiSecret").map(|v| v.as_str().unwrap())?;
            let function = SmsSender {
                // integration: integration.clone(),
                api_key: api_key.to_string(),
                api_secret: api_secret.to_string()
            };
            println!("Function: {:?}", function);
            return Some(Function::SMSSender { function })
        } else {
            return None
        }
    }
}
