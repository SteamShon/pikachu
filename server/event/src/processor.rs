use chrono::prelude::*;
use chrono::Duration;
use chrono::DurationRound;
use chrono::{Datelike, NaiveDate, Weekday};
use common::db::creative;
use common::db::creative_stat;
use common::db::PrismaClient;
use prisma_client_rust::raw;
use prisma_client_rust::PrismaValue;
use prisma_client_rust::Raw;
use rdkafka::client::DefaultClientContext;
use rdkafka::error::KafkaResult;
use rdkafka::producer::FutureProducer;
use rdkafka::{
    consumer::{CommitMode, Consumer, StreamConsumer},
    message::BorrowedMessage,
    ClientConfig, Message,
};
use serde::Deserialize;
use serde::Serialize;
use std::time::Instant;
use std::{collections::HashMap, sync::Arc};
use tokio::runtime::Runtime;

use crate::publisher::Event;
use crate::publisher::Publisher;
use crate::util::init_consumer;
use crate::util::init_future_producer;
#[derive(Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct StatKey {
    pub time_unit: String,
    pub time: DateTime<FixedOffset>,
    pub creative_id: String,
}

pub struct Processor {
    consumer: Option<StreamConsumer>,
    client: Arc<PrismaClient>,
    producer: Option<FutureProducer>,
}
impl Processor {
    fn deserialize_event(m: &BorrowedMessage) -> Option<Event> {
        let bytes = m.payload()?;

        serde_json::from_slice(bytes).ok()
    }

    fn timestamp(event: &Event) -> Option<DateTime<Utc>> {
        Utc.timestamp_millis_opt(event.when.try_into().unwrap())
            .single()
    }
    fn to_stats(aggr: &HashMap<StatKey, (i64, i64)>) -> Vec<creative_stat::Data> {
        aggr.iter()
            .map(
                |(
                    StatKey {
                        time_unit,
                        time,
                        creative_id,
                    },
                    (imp, clk),
                )| creative_stat::Data {
                    time_unit: time_unit.clone(),
                    time: *time,
                    creative_id: creative_id.clone(),
                    impression_count: *imp,
                    click_count: *clk,
                    created_at: Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap()),
                    updated_at: Utc::now().with_timezone(&FixedOffset::east_opt(0).unwrap()),
                },
            )
            .collect()
    }
    fn aggregate_stats(stats: &Vec<creative_stat::Data>) -> HashMap<StatKey, (i64, i64)> {
        let mut aggr = HashMap::new();
        for stat in stats {
            let key = StatKey {
                time_unit: stat.time_unit.clone(),
                time: stat.time,
                creative_id: stat.creative_id.clone(),
            };
            let (imps, clks) = aggr.entry(key).or_insert_with(|| (0, 0));
            *imps += stat.impression_count;
            *clks += stat.click_count;
        }
        aggr
    }
    fn aggregate_events(events: &Vec<Event>) -> HashMap<StatKey, (i64, i64)> {
        let mut aggr = HashMap::new();
        for event in events {
            if let Some(dt) = Self::timestamp(event) {
                if let Ok(_time) = dt.duration_trunc(Duration::days(1)) {
                    let time = _time.with_timezone(&FixedOffset::east_opt(0).unwrap());

                    let key = StatKey {
                        time_unit: "day".to_string(),
                        time,
                        creative_id: event.which.clone(),
                    };

                    let (impressions, clicks) = aggr.entry(key).or_insert_with(|| (0, 0));
                    if event.what == "impression" {
                        *impressions += 1;
                    } else if event.what == "click" {
                        *clicks += 1;
                    }
                }
            };
        }

        aggr
    }
    async fn aggregate_events_then_publish(&self, topic: &str, events: &Vec<Event>) {
        let aggr = Self::aggregate_events(events);
        let stats = Self::to_stats(&aggr);

        if let Some(producer) = &self.producer {
            for stat in stats {
                if let Ok(payload) = serde_json::to_vec(&stat) {
                    match Publisher::send(producer, topic, &payload).await {
                        Ok((partition, offset)) => {
                            println!("partition: {:?}, offset: {:?}", partition, offset);
                        }
                        Err(error) => {
                            println!("[ERROR]: {:?}", error);
                        }
                    }
                }
            }
        }
    }
    async fn update_storage(
        &self,
        stats: &Vec<creative_stat::Data>,
    ) -> Result<Vec<Vec<creative_stat::Data>>, prisma_client_rust::QueryError> {
        let client = &self.client;

        let mut queries = Vec::new();

        for creative_stat::Data {
            time_unit,
            time,
            creative_id,
            impression_count,
            click_count,
            created_at: _,
            updated_at: _,
        } in stats
        {
            let query = Raw::new(
                r#"
                    INSERT INTO "CreativeStat" (
                        "timeUnit",
                        "time",
                        "creativeId",
                        "impressionCount",
                        "clickCount",
                        "createdAt",
                        "updatedAt"
                    ) VALUES ($1, $2, $3, $4, $5, now(), now())
                    ON CONFLICT ("timeUnit", "time", "creativeId")
                    DO UPDATE
                    SET
                        "impressionCount" = "CreativeStat"."impressionCount"::bigint + EXCLUDED."impressionCount"::bigint,
                        "clickCount" = "CreativeStat"."clickCount"::bigint + EXCLUDED."clickCount"::bigint,
                        "updatedAt" = EXCLUDED."updatedAt"
                    RETURNING 
                        "timeUnit",
                        "time",
                        "creativeId",
                        "impressionCount",
                        "clickCount",
                        "createdAt",
                        "updatedAt"
                "#,
                vec![
                    PrismaValue::String(time_unit.clone()),
                    PrismaValue::DateTime(time.clone()),
                    PrismaValue::String(creative_id.clone()),
                    PrismaValue::Int(impression_count.clone()),
                    PrismaValue::Int(click_count.clone()),
                ],
            );

            queries.push(client._query_raw::<creative_stat::Data>(query));
        }

        client._batch(queries).await
    }
    async fn publish_stored_stats(
        &self,
        topic: &str,
        stored_stats: &Vec<Vec<creative_stat::Data>>,
    ) {
        for stored_stat in stored_stats {
            for creative_stat in stored_stat {
                if let Some(producer) = &self.producer {
                    if let Ok(payload) = serde_json::to_vec(&creative_stat) {
                        match Publisher::send(producer, topic, &payload).await {
                            Ok((partition, offset)) => {
                                println!("partition: {:?}, offset: {:?}", partition, offset);
                            }
                            Err(error) => {
                                println!("[ERROR]: {:?}", error);
                            }
                        }
                    }
                }
            }
        }
    }
    async fn consume_and_process(&self, topic: &str) {
        let stored_stats_topic = "events-stat";
        match &self.consumer {
            None => {}
            Some(consumer) => {
                consumer
                    .subscribe(&vec![topic])
                    .expect("Can't subscribe to specified topics");

                let mut started_at = Instant::now();

                let interval_in_millis = 10 * 1000;
                let buffer_flush_size = 100;
                let mut messages = Vec::new();
                let mut events = Vec::new();
                loop {
                    match consumer.recv().await {
                        Err(e) => println!("Kafka error: {}", e),
                        Ok(m) => match Self::deserialize_event(&m) {
                            Some(event) => {
                                messages.push(m);
                                events.push(event);
                            }
                            None => {}
                        },
                    };

                    let need_flush = events.len() > buffer_flush_size
                        || started_at.elapsed().as_millis() > interval_in_millis;

                    if need_flush {
                        let aggr = Self::aggregate_events(&events);
                        let stats = Self::to_stats(&aggr);
                        println!("{:?}", stats);

                        let update_result = self.update_storage(&stats).await;
                        println!("{:?}", update_result);

                        if let Ok(stored_stats) = update_result {
                            println!("{:?}", stored_stats);
                            self.publish_stored_stats(stored_stats_topic, &stored_stats)
                                .await;
                        }

                        for i in 0..events.len() {
                            let m = &messages[i];
                            // let event = &events[i];
                            // println!("[{:?}]: {:?}", m.offset(), event);
                            consumer.commit_message(m, CommitMode::Async).unwrap();
                        }

                        events.clear();
                        messages.clear();
                        started_at = Instant::now();
                    }
                }
            }
        }
    }
    pub fn new(
        rt: &Runtime,
        client: Arc<PrismaClient>,
        group_id: &str,
        topic: &str,
        kafka_configs: &Option<HashMap<String, String>>,
    ) {
        let consumer = match kafka_configs {
            None => None,
            Some(configs) => Some(init_consumer(group_id, &configs)),
        };
        let producer = match kafka_configs {
            None => None,
            Some(configs) => match init_future_producer(configs) {
                Ok(producer) => Some(producer),
                Err(error) => {
                    println!("[ERROR]: {:?}", error);
                    None
                }
            },
        };
        let created = Arc::new(Self {
            consumer,
            client,
            producer,
        });
        let topic_arc = Arc::new(topic.to_string());

        rt.spawn(async move {
            let event_consumer = created.clone();
            let topic = topic_arc.clone();
            event_consumer.consume_and_process(&topic).await;
        });
    }
}
