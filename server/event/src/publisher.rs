use actix_web::web::Bytes;
use apache_avro::Writer;
use apache_avro::{types::Value, Schema};
use rdkafka::error::KafkaResult;
use rdkafka::{
    client::DefaultClientContext,
    producer::{FutureProducer, FutureRecord},
    ClientConfig,
};
use schema_registry_converter::async_impl::avro::AvroEncoder;
use schema_registry_converter::error::SRCError;
use schema_registry_converter::{
    async_impl::schema_registry::SrSettings, schema_registry_common::SubjectNameStrategy,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, time::Duration};

use crate::util::init_future_producer;

pub const EVENT_SCHEMA_RAW: &str = r#"
{
  "doc": "Schema for impression/click user action.",
  "fields": [
    {
      "doc": "The epoch time in millis",
      "name": "when",
      "type": "long"
    },
    {
      "doc": "The unique user identifier.",
      "name": "who",
      "type": "string"
    },
    {
      "doc": "The name of this event",
      "name": "what",
      "type": "string"
    },
    {
      "doc": "The target of this event",
      "name": "which",
      "type": "string"
    },
    {
      "doc": "The extra properties on this event",
      "name": "props",
      "type": "string"
    }
  ],
  "name": "eventRecord",
  "namespace": "com.pikachu.event",
  "type": "record"
}
"#;

#[derive(Debug, Serialize, Deserialize)]
pub struct Event {
    pub when: u64,
    pub who: String,
    pub what: String,
    pub which: String,
    pub props: Option<serde_json::Value>,
}

#[derive(Debug)]
pub enum PublishError {
    SerdeJsonError(serde_json::Error),
    InvalidEventError,
    SchemaRegistryError(SRCError),
    EventSchemaNotMatchedError(apache_avro::Error),
    AvroResultError(apache_avro::Error),
    KafkaPublishError((rdkafka::error::KafkaError, rdkafka::message::OwnedMessage)),
}
pub struct Publisher<'a> {
    encoder: Option<AvroEncoder<'a>>,
    producer: Option<FutureProducer<DefaultClientContext>>,
    default_avro_schema: apache_avro::Schema,
}
impl<'a> Publisher<'a> {
    pub fn new(
        schema_registry_settings: Option<SrSettings>,
        producer_configs: &Option<HashMap<String, String>>,
    ) -> Self {
        println!("producer config: {:?}", producer_configs);
        println!("schema registry config: {:?}", schema_registry_settings);

        let producer = match producer_configs {
            None => None,
            Some(configs) => match init_future_producer(configs) {
                Ok(producer) => Some(producer),
                Err(error) => {
                    println!("[ERROR]: {:?}", error);
                    None
                }
            },
        };
        let encoder = schema_registry_settings.map(|config| AvroEncoder::new(config));
        let default_avro_schema: Schema = Schema::parse_str(EVENT_SCHEMA_RAW).unwrap();

        Publisher {
            encoder,
            producer,
            default_avro_schema,
        }
    }

    pub fn json_to_avro_value(
        event: &serde_json::Value,
    ) -> Result<Vec<(&str, Value)>, PublishError> {
        let kvs = event
            .as_object()
            .map_or(Err(PublishError::InvalidEventError), |object| Ok(object))?;
        let mut values: Vec<(&str, Value)> = Vec::new();
        for (k, v) in kvs {
            if let Ok(avro_value) = apache_avro::to_value(v) {
                values.push((k.as_str(), avro_value));
            }
        }

        Ok(values)
    }

    pub async fn publish(&self, topic: &str, event: &Event) -> Result<(i32, i64), PublishError> {
        match (&self.producer, &self.encoder) {
            (Some(producer), Some(encoder)) => {
                Self::publish_with_schema_registry_as_avro(event, topic, encoder, producer).await
            }
            (Some(producer), None) => {
                // Self::publish_without_schema_registry_as_avro(
                //     event,
                //     &self.default_avro_schema,
                //     topic,
                //     producer,
                // )
                // .await
                Self::publish_without_schema_registry_as_json(event, topic, producer).await
            }
            _ => Ok((0, 0)),
        }
    }
    pub async fn send(
        producer: &FutureProducer,
        topic: &str,
        payload: &Vec<u8>,
    ) -> Result<(i32, i64), PublishError> {
        let record: FutureRecord<str, Vec<u8>> = FutureRecord {
            topic,
            partition: None,
            payload: Some(&payload),
            key: None,
            timestamp: None,
            headers: None,
        };

        producer
            .send(record, Duration::from_secs(0))
            .await
            .map_err(|error| PublishError::KafkaPublishError(error))
    }

    async fn publish_with_schema_registry_as_avro(
        event: &Event,
        topic: &str,
        encoder: &AvroEncoder<'_>,
        producer: &FutureProducer,
    ) -> Result<(i32, i64), PublishError> {
        let payload = Self::serialize_as_avro_with_schema(topic, event, encoder).await?;

        Self::send(producer, topic, &payload).await
    }
    async fn publish_without_schema_registry_as_json(
        event: &Event,
        topic: &str,
        producer: &FutureProducer,
    ) -> Result<(i32, i64), PublishError> {
        let payload = Self::serialize_as_json_without_schema(event)?;

        Self::send(producer, topic, &payload).await
    }
    async fn publish_without_schema_registry_as_avro(
        event_bytes: &Bytes,
        avro_schema: &Schema,
        topic: &str,
        producer: &FutureProducer,
    ) -> Result<(i32, i64), PublishError> {
        let payload = Self::serialize_as_avro_without_schema(event_bytes, avro_schema)?;

        Self::send(producer, topic, &payload).await
    }

    fn serialize_as_json_without_schema(event: &Event) -> Result<Vec<u8>, PublishError> {
        // skip validation check
        // Ok(event_bytes.to_vec())
        let event_bytes = serde_json::to_vec(event).unwrap();
        let event: Event = serde_json::from_slice(&event_bytes)
            .map_err(|error| PublishError::SerdeJsonError(error))?;
        let str =
            serde_json::to_string(&event).map_err(|error| PublishError::SerdeJsonError(error))?;

        Ok(str.as_bytes().to_vec())
    }
    async fn serialize_as_avro_with_schema(
        topic: &str,
        event: &Event,
        encoder: &AvroEncoder<'_>,
    ) -> Result<Vec<u8>, PublishError> {
        let event_bytes = serde_json::to_vec(event).unwrap();
        let event: serde_json::Value = serde_json::from_slice(&event_bytes)
            .map_err(|error| PublishError::SerdeJsonError(error))?;
        let values = Self::json_to_avro_value(&event)?;

        let subject_name_strategy = SubjectNameStrategy::TopicNameStrategy(topic.to_owned(), false);

        encoder
            .encode(values, subject_name_strategy)
            .await
            .map_err(|error| PublishError::SchemaRegistryError(error))
    }
    fn serialize_as_avro_without_schema(
        event_bytes: &Bytes,
        avro_schema: &Schema,
    ) -> Result<Vec<u8>, PublishError> {
        let event_payload: Event = serde_json::from_slice(&event_bytes)
            .map_err(|error| PublishError::SerdeJsonError(error))?;
        let mut writer = Writer::new(avro_schema, Vec::new());

        writer
            .append_ser(event_payload)
            .map_err(|error| PublishError::EventSchemaNotMatchedError(error))?;
        let payload = writer
            .into_inner()
            .map_err(|error| PublishError::AvroResultError(error));
        payload
    }
}
