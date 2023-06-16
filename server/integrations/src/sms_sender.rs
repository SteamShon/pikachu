use std::time::SystemTime;

use hmac::{Hmac, Mac};
use prisma_client_rust::chrono::{DateTime, SecondsFormat, Utc};
use rand::Rng;
use rand_distr::Alphanumeric;
use reqwest::header::AUTHORIZATION;
use serde_json::json;
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone)]
pub struct SmsSender {
    // pub integration: integration::Data,
    pub api_key: String,
    pub api_secret: String,
    pub uri: String,
}

impl SmsSender {
    fn gen_ran_hex(size: usize) -> String {
        rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(size)
            .map(char::from)
            .collect()
    }
    fn get_header_values(size: usize, now_opt: Option<String>) -> (String, String, String) {
        let now: DateTime<Utc> = SystemTime::now().into();
        let salt = Self::gen_ran_hex(size);
        let message = format!("{}{}", now.to_rfc3339(), salt,);
        let date = now_opt.unwrap_or(now.to_rfc3339_opts(SecondsFormat::Millis, true));
        (date, salt, message)
    }
    fn get_header_signature(&self, date: &String, salt: &String) -> String {
        let message = format!("{}{}", date, salt);
        let mut mac = HmacSha256::new_from_slice(self.api_secret.as_bytes())
            .expect("HMAC can take key of any size");
        mac.update(message.as_bytes());

        let result = mac.finalize();
        let code_bytes = result.into_bytes();

        hex::encode(&code_bytes)
    }
    fn authorization(&self, now_opt: Option<String>) -> String {
        let (date, salt, _message) = Self::get_header_values(64, now_opt);
        let signature = self.get_header_signature(&date, &salt);

        let api_key = &self.api_key;
        format!(
            "HMAC-SHA256 apiKey={}, date={}, salt={}, signature={}",
            api_key, date, salt, signature
        )
    }
    pub async fn apply(
        &self,
        payload: &serde_json::Value,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let messages = json!({ "messages": payload });

        let client = reqwest::Client::new();
        let authorization = self.authorization(None);
        client
            .post(&self.uri)
            .header(AUTHORIZATION, authorization)
            .json(&messages)
            .send()
            .await
    }
}
