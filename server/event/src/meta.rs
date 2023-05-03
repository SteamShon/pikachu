// use std::{collections::HashMap, sync::Arc};
// use common::db::{
//     service, PrismaClient
// };
// use prisma_client_rust::{chrono::{DateTime, FixedOffset}, Direction};

// pub struct Meta {
//     services: HashMap<String, service::Data>,
//     last_updated_at: DateTime<FixedOffset>,
// }

// impl Meta {
//     async fn fetch_services(
//         client: Arc<PrismaClient>,
//         last_updated_at: DateTime<FixedOffset>,
//     ) -> Vec<service::Data> {
//         client
//             .service()
//             .find_many(vec![service::updated_at::gt(last_updated_at)])
//             .order_by(service::updated_at::order(Direction::Desc))
//             .exec()
//             .await
//             .unwrap()
//     }
//     fn update_services(&mut self, new_services: &Vec<service::Data>) -> () {
//         let services = &mut self.services;
//         if let Some(latest_updated_service) = new_services.first() {
//             let update_info = &mut self.last_updated_at;
//             *update_info = latest_updated_service.updated_at;
//         }
//         for service in new_services {
//             services.insert(service.id.clone(), service.clone());
//         }
//     }
//     async fn fetch_and_update_services(
//         &mut self,
//         client: Arc<PrismaClient>,
//         last_updated_at: Option<DateTime<FixedOffset>>,
//     ) -> () {
//         let last_updated_at_value = last_updated_at.unwrap_or(self.last_updated_at);
//         let new_services = &Self::fetch_services(client, last_updated_at_value).await;
//         println!("[new_services]: {:?}", new_services.len());
//         self.update_services(new_services);
//     }
//     pub fn get_topic(&self, service_id: &str) -> Option<String> {
//         let service = self.services.get(service_id)?;

//         Some(service.name.to_string())
//     }
// }
