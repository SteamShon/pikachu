use crate::publisher::Publisher;
use crate::{handler::Processor, publisher::Event};
use async_trait::async_trait;
use chrono::prelude::*;
use chrono::Duration;
use chrono::DurationRound;
use common::db::creative_stat;
use common::db::PrismaClient;
use prisma_client_rust::PrismaValue;
use prisma_client_rust::Raw;
use rdkafka::producer::FutureProducer;
use rdkafka::{message::BorrowedMessage, Message};
use serde::Deserialize;
use serde::Serialize;
use std::{collections::HashMap, sync::Arc};

#[derive(Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
struct StatKey {
    time_unit: String,
    time: DateTime<FixedOffset>,
    creative_id: String,
}
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
        if let Some(dt) = timestamp(event) {
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
async fn aggregate_events_then_publish(
    producer: &FutureProducer,
    topic: &str,
    events: &Vec<Event>,
) {
    let aggr = aggregate_events(events);
    let stats = to_stats(&aggr);

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
async fn update_storage(
    client: Arc<PrismaClient>,
    stats: &Vec<creative_stat::Data>,
) -> Result<Vec<Vec<creative_stat::Data>>, prisma_client_rust::QueryError> {
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
    producer: &Option<FutureProducer>,
    topic: &str,
    stored_stats: &Vec<Vec<creative_stat::Data>>,
) {
    for stored_stat in stored_stats {
        for creative_stat in stored_stat {
            if let Ok(payload) = serde_json::to_vec(&creative_stat) {
                if let Some(p) = producer {
                    match Publisher::send(p, topic, &payload).await {
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

pub async fn process(
    client: Arc<PrismaClient>,
    producer: &Option<FutureProducer>,
    messages: &Vec<BorrowedMessage<'_>>,
) -> Vec<bool> {
    let stored_stats_topic = "events-stat";
    let mut events = Vec::new();
    for m in messages {
        if let Some(event) = deserialize_event(&m) {
            events.push(event);
        }
    }

    let aggr = aggregate_events(&events);
    let stats = to_stats(&aggr);
    let update_result = update_storage(client, &stats).await;

    if let Ok(stored_stats) = update_result {
        publish_stored_stats(producer, stored_stats_topic, &stored_stats).await;
    }

    messages.iter().map(|_m| true).collect()
}

pub struct StatProcessor {
    pub client: Arc<PrismaClient>,
    pub producer: Arc<Option<FutureProducer>>,
}

#[async_trait]
impl Processor for StatProcessor {
    async fn process(&self, messages: &Vec<BorrowedMessage<'_>>) -> Vec<bool> {
        process(self.client.clone(), &self.producer, messages).await
    }
}
