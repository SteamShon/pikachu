use std::{collections::HashMap, time::Duration};
use rdkafka::{producer::{FutureRecord, FutureProducer}, client::DefaultClientContext, ClientConfig};
use apache_avro::types::Value;
use schema_registry_converter::{async_impl::{schema_registry::SrSettings}, schema_registry_common::SubjectNameStrategy};
use schema_registry_converter::async_impl::avro::AvroEncoder;

pub struct Publisher<'a> {
    encoder: Option<AvroEncoder<'a>>,
    producer: Option<FutureProducer<DefaultClientContext>>,
}
impl<'a> Publisher<'a> {
    pub fn new(
        schema_registry_settings: Option<SrSettings>, 
        producer_configs: Option<HashMap<&str, String>>
    ) -> Self {
        let producer = 
            producer_configs
                .map(|config| 
                    Self::init_future_producer(config)
                );
        let encoder = 
            schema_registry_settings.map(|config| AvroEncoder::new(config));

        Publisher { 
            encoder, 
            producer,
        }
    }
    
    pub fn json_to_avro_value(event: &serde_json::Value) -> Vec<(&str, Value)> {
        let kvs = event.as_object().unwrap();
        let mut values: Vec<(&str, Value)> = Vec::new();
        for (k, v) in kvs {
            if let Ok(avro_value) = apache_avro::to_value(v) {
                values.push((k.as_str(), avro_value));
            }
        }

        values
    }
    
    pub async fn publish(
        &self, 
        topic: &str,
        event: &serde_json::Value
    ) -> Result<(i32, i64), (rdkafka::error::KafkaError, rdkafka::message::OwnedMessage)> {

        match (&self.producer, &self.encoder) {
            (Some(producer), Some(encoder)) => {
                let values = Self::json_to_avro_value(event);

                let subject_name_strategy = 
                    SubjectNameStrategy::TopicNameStrategy(topic.to_owned(), false);
        
                let payload = encoder
                    .encode(values, subject_name_strategy)
                    .await
                    .unwrap();
        
                let record: FutureRecord<str, Vec<u8>> = FutureRecord {
                    topic,
                    partition: None,
                    payload: Some(&payload),
                    key: None,
                    timestamp: None,
                    headers: None,
                };
                
                producer.send(record, Duration::from_secs(0)).await
            }
            _ => Ok((0, 0))
        }
    }
    
    fn init_future_producer(config_overrides: HashMap<&str, String>) -> FutureProducer<DefaultClientContext> {
        let mut config = ClientConfig::new();
        for (key, value) in config_overrides {
            config.set(key, value);
        }
        config.create().expect("Failed to create producer")
    }
}