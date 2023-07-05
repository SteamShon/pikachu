use std::{sync::{Arc, Mutex}, collections::HashMap, time::Instant};
use async_trait::async_trait;
use common::db::PrismaClient;
use integrations::integrations::Integrations;
use rdkafka::{message::BorrowedMessage, producer::FutureProducer, consumer::{StreamConsumer, Consumer, CommitMode}};
use tokio::runtime::Runtime;

use crate::{util::{init_consumer, init_future_producer}, stat_processor::StatProcessor, message_send_processor::MessageSendProcessor};

#[async_trait]
pub trait Processor {
    async fn process(
        &self,
        messages: &Vec<BorrowedMessage<'_>>,
    ) -> Vec<bool>;
}


pub struct ProcessorRunner {
    pub consumer: Option<StreamConsumer>,
    pub client: Arc<PrismaClient>,
    pub producer: Arc<Option<FutureProducer>>,
    pub input_topic: String,
    pub processor: Box<dyn Processor + Send + Sync>,
}

impl ProcessorRunner {
    async fn run(&self) -> () {
        match &self.consumer {
            None => {
                ()
            },
            Some(consumer) => {
                consumer
                    .subscribe(&vec![self.input_topic.as_str()])
                    .expect("Can't subscribe to specified topics");

                let mut started_at = Instant::now();

                let interval_in_millis = 10 * 1000;
                let buffer_flush_size = 100;
                let mut messages = Vec::new();
                loop {
                    match consumer.recv().await {
                        Err(e) => println!("Kafka error: {}", e),
                        Ok(m) => {
                                messages.push(m);
                        }
                    };

                    let need_flush = messages.len() > buffer_flush_size
                        || started_at.elapsed().as_millis() > interval_in_millis;

                    if need_flush {
                        let results = self.processor.process(&messages).await;

                        for i in 0..results.len() {
                            let m = &messages[i];
                            let res = results[i];
                            if res {
                                consumer.commit_message(m, CommitMode::Async).unwrap();
                            }
                        }

                        messages.clear();
                        started_at = Instant::now();
                    }
                }
            }
        }
        ()
    }
    pub fn new(
        rt: &Runtime, 
        consumer: Option<StreamConsumer>,
        producer: Arc<Option<FutureProducer>>,
        input_topic: &str,
        client: Arc<PrismaClient>,
        processor: Box<dyn Processor + Send + Sync>
    ) -> () {
        let runner = ProcessorRunner { 
            consumer,
            producer,
            client,
            input_topic: input_topic.to_string(),
            processor
        };
        rt.spawn(async move {
            runner.run().await;
        });
    }
}

pub fn initialize_stat_processor_runner(
    rt: &Runtime, 
    kafka_configs: &Option<HashMap<String, String>>,
    input_topic: &str,
    group_id: &str,
    client: Arc<PrismaClient>,
) -> () {
    let producer = match kafka_configs {
        None => None,
        Some(configs) => init_future_producer(configs).ok()
    };
    let consumer = match kafka_configs {
        None => None,
        Some(configs) => Some(init_consumer(group_id, configs))
    };
    let producer_arc = Arc::new(producer);
    // let consumer_arc = Arc::new(consumer);
    let processor = Box::new(StatProcessor { client: client.clone(), producer: producer_arc.clone()});

    ProcessorRunner::new(
        rt,
        consumer, 
        producer_arc.clone(), 
        input_topic, 
        client.clone(), 
        processor
    );
}

pub async fn initialize_message_send_processor_runner(
    rt: &Runtime, 
    kafka_configs: &Option<HashMap<String, String>>,
    input_topic: &str,
    group_id: &str,
    client: Arc<PrismaClient>,
) -> () {
    let producer = match kafka_configs {
        None => None,
        Some(configs) => init_future_producer(configs).ok()
    };
    let consumer = match kafka_configs {
        None => None,
        Some(configs) => Some(init_consumer(group_id, configs))
    };
    let producer_arc = Arc::new(producer);
    let processor = Box::new(
        MessageSendProcessor::new(client.clone()).await
    );

    ProcessorRunner::new(
        rt,
        consumer, 
        producer_arc.clone(), 
        input_topic, 
        client.clone(), 
        processor
    );
}