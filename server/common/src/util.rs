use std::collections::{HashMap, HashSet};

use crate::{db::{placement, integration, content_type, content, creative, ad_group, campaign, provider}, types::UserInfo};

pub const USER_FEATURE_SQL_TEMPLATE: &str = r#"SELECT * FROM "UserFeature" WHERE "cubeHistoryId" = '{}' AND "userId" = '{}'"#;

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
pub fn parse_user_info(value: &serde_json::Value) -> Option<UserInfo> {
    let mut user_info = HashMap::new();
    for (k, v) in value.as_object()?.iter() {
        let mut items = HashSet::new();

        match v.as_array() {
            Some(values) => {
                for item in values {
                    if let Some(s) = json_value_to_string(item) {
                        items.insert(s);
                    }
                }
            }
            None => {
                if let Some(s) = json_value_to_string(v) {
                    items.insert(s);
                }
            }
        }
        user_info.insert(k.clone(), items);
    }

    Some(user_info)
}

pub fn is_active_placement(placement: &placement::Data) -> bool {
    placement.status.to_lowercase() == "published"
}
pub fn is_active_campaign(campaign: &campaign::Data) -> bool {
    campaign.status.to_lowercase() == "published"
}
pub fn is_active_ad_group(ad_group: &ad_group::Data) -> bool {
    ad_group.status.to_lowercase() == "published"
}
pub fn is_active_creative(creative: &creative::Data) -> bool {
    creative.status.to_lowercase() == "published"
}
pub fn is_active_content(content: &content::Data) -> bool {
    content.status.to_lowercase() == "published"
}
pub fn is_active_content_type(content_type: &content_type::Data) -> bool {
    content_type.status.to_lowercase() == "published"
}
pub fn is_active_integration(integration: &integration::Data) -> bool {
    integration.status.to_lowercase() == "published"
}
pub fn is_active_provider(provider: &provider::Data) -> bool {
    provider.status.to_lowercase() == "published"
}