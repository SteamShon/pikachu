

use std::{collections::HashMap, sync::Arc, time::SystemTime};

use async_trait::async_trait;
use prisma_client_rust::{raw, QueryError, chrono::{Utc, DateTime, SecondsFormat}};

use common::{db::{integration, user_feature, provider, PrismaClient}, util::parse_user_info, types::UserInfo};
use futures::future::join_all;
use serde::Deserialize;
use serde_json::json;
use rand::{thread_rng, Rng};
use rand_distr::{Distribution, Normal, NormalError, num_traits::{Float, sign}, Alphanumeric};
use sha2::Sha256;
use hmac::{Hmac, Mac};
use hex_literal::hex;
use reqwest::header::AUTHORIZATION;

const url: &str = "https://api.solapi.com/messages/v4/send-many/detail";

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone)]
pub struct SmsSender {
    // pub integration: integration::Data,
    pub api_key: String,
    pub api_secret: String,
}

impl SmsSender {
    fn gen_ran_hex(size: usize) -> String {
        rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(size)
        .map(char::from)
        .collect()
    }
    fn get_header_values(size: i32, now_opt: Option<String>) -> (String, String, String) {
        let now: DateTime<Utc> =  SystemTime::now().into();
        let salt = Self::gen_ran_hex(64);
        let message = format!("{}{}", 
            now.to_rfc3339(), 
            salt,
        );
        let date = now_opt.unwrap_or(
            now.to_rfc3339_opts(SecondsFormat::Millis, true)
        );
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
        format!("HMAC-SHA256 apiKey={}, date={}, salt={}, signature={}", api_key, date, salt, signature)
    }
    pub async fn apply(
        &self, 
        payload: &serde_json::Value,
    ) -> Result<reqwest::Response, reqwest::Error> {
        let messages = json!({"messages": payload});
        
        let client = reqwest::Client::new();
        let authorization = self.authorization(None);
        client.post(url)
            .header(AUTHORIZATION, authorization)
            .json(&messages)
            .send()
            .await
    }
   
}

#[cfg(test)]
mod tests {
    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn test_signature() {
        let api_key = "NCSXVASNGYZHWJ4G";
        let api_secret = "IIPBGQUCCBICABQBXJZ8W5OUJDUV13LI";
        let date = "2023-05-31T05:11:20.872Z";
        let salt = "8f9c6a3c483a8bfc22f63da6ef00a0a1f26d04000311ce427b385dad5e1458ab";
        let expected_signature = "e4a0a1388d7c798bbf5cb38d682e26244fb82bebc3bc27964933595ef6ab6fba";
        let sender = SmsSender { 
            api_key: api_key.to_string(),
            api_secret: api_secret.to_string(),
        };
        let date = Some("2023-05-31T05:11:20.872Z".to_string());
        let authorization = sender.authorization(date);
        println!("{:?}", authorization);
        println!("HMAC-SHA256 apiKey=NCSXVASNGYZHWJ4G, date=2023-05-31T05:11:20.872Z, salt=8f9c6a3c483a8bfc22f63da6ef00a0a1f26d04000311ce427b385dad5e1458ab, signature=e4a0a1388d7c798bbf5cb38d682e26244fb82bebc3bc27964933595ef6ab6fba");
    }

}
