use async_trait::async_trait;
use chrono::prelude::*;
use chrono::Duration;
use chrono::DurationRound;
use common::db::{creative_stat, placement, provider, integration};
use common::db::PrismaClient;
use integrations::integrations::Integrations;
use prisma_client_rust::{PrismaValue, Direction};
use prisma_client_rust::Raw;
use rdkafka::producer::FutureProducer;
use rdkafka::{
    message::BorrowedMessage,
    Message,
};
use serde::Deserialize;
use serde::Serialize;
use serde_json::json;
use std::{collections::HashMap, sync::Arc};
use crate::{publisher::Event, handler::Processor};
use crate::publisher::Publisher;
// return {
//         when: now,
//         who: row.to_column,
//         what,
//         which: row.ad_set_id,
//         props: {
//           placementId: row.placement_id,
//           from: row.from_column,
//         },
//       };
pub struct MessageSendRequest {
    placement_id: String,
    ad_set_id: String,
    from: String,
    to: String,
    text: String,
}
impl MessageSendRequest {
    fn from_event(event: Event) -> Option<Self> {
        let ad_set_id = event.which;
        let to = event.who;
        
        let props = event.props?;
        
        let text = props.get("text").map(|v| v.as_str().unwrap().to_string())?;
        let from = props.get("from").map(|v| v.as_str().unwrap().to_string())?;
        let placement_id = props.get("placementId").map(|v| v.as_str().unwrap().to_string())?;

        Some( Self { to, from, text, placement_id, ad_set_id })
    }
}
pub struct MessageSendProcessor{
    pub client: Arc<PrismaClient>,
    pub integrations: Integrations
    // pub producer: Arc<Option<FutureProducer>>,
}

impl MessageSendProcessor {
    fn parse_message(m: &BorrowedMessage<'_>) -> Option<MessageSendRequest> {
        let bytes = m.payload()?;

        let event: Event = serde_json::from_slice(bytes).ok()?;
        MessageSendRequest::from_event(event)
    }

    async fn fetch_placements(
        client: Arc<PrismaClient>,
    ) -> Vec<placement::Data> {
        client
            .placement()
            .find_many(vec![])
            .with(
                placement::integrations::fetch(vec![])
                .with(integration::provider::fetch())
            )
            .order_by(placement::updated_at::order(Direction::Desc))
            .exec()
            .await
            .unwrap()
    }
    async fn fetch_providers(
        client: Arc<PrismaClient>,
    ) -> Vec<provider::Data> {
        client
            .provider()
            .find_many(vec![])
            .order_by(provider::updated_at::order(Direction::Desc))
            .exec()
            .await
            .unwrap()
    }
    pub async fn new(
        client: Arc<PrismaClient>, 
    ) -> Self {
        let placements = Self::fetch_placements(client.clone()).await;
        let providers = Self::fetch_providers(client.clone()).await;
        let integrations = Integrations::new(&placements, &providers).await;

        MessageSendProcessor { 
            client: client.clone(),
            integrations,
        }
    }
}
#[async_trait]
impl Processor for MessageSendProcessor {
    async fn process(
        &self,
        messages: &Vec<BorrowedMessage<'_>>
    ) -> Vec<bool> {
        let mut placement_requests = HashMap::new();
        for m in messages {
            if let Some(request) = Self::parse_message(m) {
                placement_requests
                    .entry(request.placement_id.clone())
                    .or_insert_with(|| Vec::new())
                    .push(request);
            }
        }
        for (placement_id, requests) in placement_requests {
            let messages: Vec<serde_json::Value> = requests.iter().map(|r| json!({
                "from": r.from,
                "to": r.to,
                "text": r.text,
            })).collect();

            let payload = json!(messages);
            println!("{:?}: {:?}", placement_id, payload);

            let response = self.integrations.send_sms(placement_id.as_str(), &payload).await;
            if let Some(res) = response {
                println!("{:?}", res.bytes().await);
            }
        }
        
        messages.iter().map(|m| true).collect()
    }
}