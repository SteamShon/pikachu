use std::collections::HashMap;

use schema_registry_converter::async_impl::schema_registry::SrSettings;
pub fn parse_schema_registry_settings(envs: &HashMap<String, String>) -> Option<SrSettings> {
    envs.get("SCHEMA_REGISTRY_URL")
        .map(|v| SrSettings::new(v.to_string()))
}

pub fn parse_kafka_config(envs: &HashMap<String, String>) -> Option<HashMap<String, String>> {
    let mut copied_envs = HashMap::new();
    for (key, value) in envs {
        copied_envs.insert(replace_underbar_to_dot(&key), value.to_string());
    }
    let required_keys = vec!["bootstrap.servers"];
    let optional_keys = vec![
        "sasl.mechanism",
        "security.protocol",
        "sasl.username",
        "sasl.password",
    ];

    filter_envs(&copied_envs, &required_keys, &optional_keys)
}

fn filter_envs(
    envs: &HashMap<String, String>,
    required_keys: &Vec<&str>,
    optional_keys: &Vec<&str>,
) -> Option<HashMap<String, String>> {
    let mut configs = HashMap::new();

    for key in required_keys {
        let value = envs.get(*key)?;
        if !value.is_empty() {
            configs.insert(key.to_string(), value.clone());
        }
    }
    for key in optional_keys {
        if let Some(value) = envs.get(*key) {
            if !value.is_empty() {
                configs.insert(key.to_string(), value.clone());
            }
        }
    }

    let all_keys_exist = required_keys.iter().all(|key| configs.contains_key(*key));

    if all_keys_exist {
        Some(configs)
    } else {
        None
    }
}
pub fn parse_envs<I>(iter: I) -> HashMap<String, String>
where
    I: Iterator<Item = (String, String)>,
{
    let mut configs = HashMap::new();
    for (key, value) in iter {
        configs.insert(key, value);
    }
    configs
}
fn replace_underbar_to_dot(key: &str) -> String {
    key.replace("_", ".").to_lowercase()
}
