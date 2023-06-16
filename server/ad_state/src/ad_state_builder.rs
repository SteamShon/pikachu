use std::{sync::Arc, collections::HashMap};
use common::{db::{
    ad_group, campaign, content, content_type, creative, placement, service,
    PrismaClient, integration,
}, util::is_active_ad_group};
use integrations::integrations::Integrations;
use crate::{ad_state::{AdState, AdGroup}};
use common::db::provider;
use filter::index::FilterIndex;
use prisma_client_rust::{chrono::{DateTime, FixedOffset}, Direction};


async fn fetch_services(
    client: Arc<PrismaClient>,
    last_updated_at: DateTime<FixedOffset>,
) -> Vec<service::Data> {
    client
        .service()
        .find_many(vec![service::updated_at::gt(last_updated_at)])
        // .with(service::service_config::fetch().with(service_config::cubes::fetch(vec![])))
        .order_by(service::updated_at::order(Direction::Desc))
        .exec()
        .await
        .unwrap()
}
async fn fetch_placements(
    client: Arc<PrismaClient>,
    last_updated_at: DateTime<FixedOffset>,
) -> Vec<placement::Data> {
    client
        .placement()
        .find_many(vec![placement::updated_at::gt(last_updated_at)])
        .with(
            placement::integrations::fetch(vec![])
            .with(integration::provider::fetch())
        )
        .order_by(placement::updated_at::order(Direction::Desc))
        .exec()
        .await
        .unwrap()
}
async fn fetch_campaigns(
    client: Arc<PrismaClient>,
    last_updated_at: DateTime<FixedOffset>,
) -> Vec<campaign::Data> {
    client
        .campaign()
        .find_many(vec![campaign::updated_at::gt(last_updated_at)])
        .order_by(campaign::updated_at::order(Direction::Desc))
        .exec()
        .await
        .unwrap()
}
async fn fetch_ad_groups(
    client: Arc<PrismaClient>,
    last_updated_at: DateTime<FixedOffset>,
) -> Vec<ad_group::Data> {
    client
        .ad_group()
        .find_many(vec![ad_group::updated_at::gt(last_updated_at)])
        .order_by(ad_group::updated_at::order(Direction::Desc))
        .exec()
        .await
        .unwrap()
}
async fn fetch_creatives(
    client: Arc<PrismaClient>,
    last_updated_at: DateTime<FixedOffset>,
) -> Vec<creative::Data> {
    client
        .creative()
        .find_many(vec![creative::updated_at::gt(last_updated_at)])
        .order_by(creative::updated_at::order(Direction::Desc))
        .exec()
        .await
        .unwrap()
}
async fn fetch_contents(
    client: Arc<PrismaClient>,
    last_updated_at: DateTime<FixedOffset>,
) -> Vec<content::Data> {
    client
        .content()
        .find_many(vec![content::updated_at::gt(last_updated_at)])
        .order_by(content::updated_at::order(Direction::Desc))
        .exec()
        .await
        .unwrap()
}
async fn fetch_content_types(
    client: Arc<PrismaClient>,
    last_updated_at: DateTime<FixedOffset>,
) -> Vec<content_type::Data> {
    client
        .content_type()
        .find_many(vec![content_type::updated_at::gt(last_updated_at)])
        .order_by(content_type::updated_at::order(Direction::Desc))
        .exec()
        .await
        .unwrap()
}
pub async fn fetch_providers(
    client: Arc<PrismaClient>,
    last_updated_at: DateTime<FixedOffset>,
) -> Vec<provider::Data> {
    client
        .provider()
        .find_many(vec![provider::updated_at::gt(last_updated_at)])
        .order_by(provider::updated_at::order(Direction::Desc))
        .exec()
        .await
        .unwrap()
}
// async fn fetch_integrations(
//     client: Arc<PrismaClient>,
//     last_updated_at: DateTime<FixedOffset>,
// ) -> Vec<integration::Data> {
//     client
//         .integration()
//         .find_many(vec![integration::updated_at::gt(last_updated_at)])
//         .with(integration::provider::fetch())
//         .order_by(integration::updated_at::order(Direction::Desc))
//         .exec()
//         .await
//         .unwrap()
// }
// async fn fetch_providers(
//     client: Arc<PrismaClient>,
//     last_updated_at: DateTime<FixedOffset>,
// ) -> Vec<provider::Data> {
//     client
//         .provider()
//         .find_many(vec![provider::updated_at::gt(last_updated_at)])
//         .order_by(provider::updated_at::order(Direction::Desc))
//         .exec()
//         .await
//         .unwrap()
// }
pub fn update_services(ad_state: &mut AdState, new_services: &Vec<service::Data>) -> () {
    let services = &mut ad_state.services;
    if let Some(latest_updated_service) = new_services.first() {
        let update_info = &mut ad_state.update_info;
        update_info.services = latest_updated_service.updated_at;
    }
    for service in new_services {
        services.insert(service.id.clone(), service.clone());
    }
}
pub fn update_placements(ad_state: &mut AdState, new_placements: &Vec<placement::Data>) -> () {
    let placements = &mut ad_state.placements;
    
    if let Some(latest_updated_placement) = new_placements.first() {
        let update_info = &mut ad_state.update_info;
        update_info.placements = latest_updated_placement.updated_at;
    }
    for placement in new_placements {
        placements.insert(placement.id.clone(), placement.clone());
    }
}
pub fn update_campaigns(ad_state: &mut AdState, new_campaigns: &Vec<campaign::Data>) -> () {
    let campaigns = &mut ad_state.campaigns;
    if let Some(latest_updated_campaign) = new_campaigns.first() {
        let update_info = &mut ad_state.update_info;
        update_info.campaigns = latest_updated_campaign.updated_at;
    }
    for campaign in new_campaigns {
        campaigns.insert(campaign.id.clone(), campaign.clone());
    }
}
fn ad_group_grouped_by_placement(
    ad_state: &AdState,
    ad_groups: &Vec<ad_group::Data>,
) -> HashMap<String, Vec<ad_group::Data>> {
    let mut placement_ad_groups = HashMap::new();
    for ad_group in ad_groups {
        if let Some(placement) = ad_state.get_placement(ad_group) {
            placement_ad_groups
                .entry(placement.id.clone())
                .or_insert_with(|| Vec::new())
                .push(ad_group.clone());
        }
    }
    placement_ad_groups
}
pub fn update_ad_groups(ad_state: &mut AdState, new_ad_groups: &Vec<ad_group::Data>) -> () {
    let ad_groups = &mut ad_state.ad_groups;
    if let Some(latest_updated_ad_group) = new_ad_groups.first() {
        let update_info = &mut ad_state.update_info;
        update_info.ad_groups = latest_updated_ad_group.updated_at;
    }
    for ad_group in new_ad_groups {
        ad_groups.insert(ad_group.id.clone(), ad_group.clone());
    }
    let placement_ad_groups = 
        ad_group_grouped_by_placement(ad_state, new_ad_groups);
    for (placement_id, ad_groups) in placement_ad_groups.iter() {
        let index = ad_state
            .filter_index
            .entry(placement_id.clone())
            .or_insert_with(|| FilterIndex::default());

        let mut ad_groups_to_insert = Vec::new();
        let mut ad_groups_to_delete = Vec::new();

        for ad_group in ad_groups {
            if is_active_ad_group(ad_group) {
                ad_groups_to_insert.push(AdGroup {
                    data: ad_group.clone(),
                });
            } else {
                ad_groups_to_delete.push(AdGroup {
                    data: ad_group.clone(),
                });
            }
        }

        index.update(&ad_groups_to_insert, &ad_groups_to_delete);
    }
}
pub fn update_creatives(ad_state: &mut AdState, new_creatives: &Vec<creative::Data>) -> () {
    let creatives = &mut ad_state.creatives;
    if let Some(latest_updated_creative) = new_creatives.first() {
        let update_info = &mut ad_state.update_info;
        update_info.creatives = latest_updated_creative.updated_at;
    }
    for creative in new_creatives {
        //TODO
        // ad_state.ranker.add_arm(&Creative { data: creative.clone() });

        creatives
            .entry(creative.ad_group_id.clone())
            .or_insert_with(|| HashMap::new())
            .insert(creative.id.clone(), creative.clone());
    }
}
pub fn update_contents(ad_state: &mut AdState, new_contents: &Vec<content::Data>) -> () {
    let contents = &mut ad_state.contents;
    if let Some(latest_updated_content) = new_contents.first() {
        let update_info = &mut ad_state.update_info;
        update_info.contents = latest_updated_content.updated_at;
    }
    for content in new_contents {
        contents.insert(content.id.clone(), content.clone());
    }
}
pub fn update_content_types(ad_state: &mut AdState, new_content_types: &Vec<content_type::Data>) -> () {
    let content_types = &mut ad_state.content_types;
    if let Some(latest_updated_content_type) = new_content_types.first() {
        let update_info = &mut ad_state.update_info;
        update_info.content_types = latest_updated_content_type.updated_at;
    }
    for content_type in new_content_types {
        content_types.insert(content_type.id.clone(), content_type.clone());
    }
}
// pub async fn update_providers(ad_state: &mut AdState, new_providers: &Vec<provider::Data>) -> () {
//     let providers = &mut ad_state.providers;
//     if let Some(latest_updated_provider) = new_providers.first() {
//         let update_info = &mut ad_state.update_info;
//         update_info.providers = latest_updated_provider.updated_at;
//     }
//     for provider in new_providers {
//         if is_active_provider(provider) {
//             providers.insert(provider.id.clone(), provider.clone());

//             if let Some(database_url) = 
//                 provider.details
//                     .get("DATABASE_URL")
//                     .map(|v| v.as_str().unwrap()) {
//                 if let Ok(client) =  db::new_client_with_url(database_url).await {
//                     ad_state.clients.insert(database_url.to_string(), Arc::new(client));
//                 }
//             }
//         }
//     }
// }
// pub fn update_integrations(&mut self, new_integrations: &Vec<integration::Data>) -> () {
//     let integrations = &mut self.integrations;
//     if let Some(latest_updated_integration) = new_integrations.first() {
//         let update_info = &mut self.update_info;
//         update_info.integrations = latest_updated_integration.updated_at;
//     }
//     for integration in new_integrations {
//         integrations
//             .entry(integration.service_id.clone())
//             .or_insert_with(|| HashMap::new())
//             .insert(integration.id.clone(), integration.clone());
//     }
// }
// pub fn update_providers(&mut self, new_providers: &Vec<provider::Data>) -> () {
//     let providers = &mut self.providers;
//     if let Some(latest_updated_provider) = new_providers.first() {
//         let update_info = &mut self.update_info;
//         update_info.providers = latest_updated_provider.updated_at;
//     }
//     for provider in new_providers {
//         providers
//             .insert(provider.id.clone(), provider.clone());
//     }
// }
pub async fn fetch_and_update_services(
    ad_state: &mut AdState,
    client: Arc<PrismaClient>,
    last_updated_at: Option<DateTime<FixedOffset>>,
) -> () {
    let last_updated_at_value = 
        last_updated_at.unwrap_or(ad_state.update_info.services);
    let new_services = fetch_services(client, last_updated_at_value).await;
    println!("[new_services]: {:?}", new_services.len());
    update_services(ad_state, &new_services);
}
pub async fn fetch_and_update_placements(
    ad_state: &mut AdState,
    client: Arc<PrismaClient>,
    last_updated_at: Option<DateTime<FixedOffset>>,
) -> Vec<placement::Data> {
    let last_updated_at_value = 
        last_updated_at.unwrap_or(ad_state.update_info.placements);
    let new_placements = fetch_placements(client, last_updated_at_value).await;
    println!("[new_placements]: {:?}", new_placements.len());
    update_placements(ad_state, &new_placements);

    new_placements
}

pub async fn fetch_and_update_campaigns(
    ad_state: &mut AdState,
    client: Arc<PrismaClient>,
    last_updated_at: Option<DateTime<FixedOffset>>,
) -> () {
    let last_updated_at_value = 
        last_updated_at.unwrap_or(ad_state.update_info.campaigns);
    let new_campaigns = fetch_campaigns(client, last_updated_at_value).await;
    println!("[new_campaigns]: {:?}", new_campaigns.len());
    update_campaigns(ad_state, &new_campaigns);
}
pub async fn fetch_and_update_ad_groups(
    ad_state: &mut AdState,
    client: Arc<PrismaClient>,
    last_updated_at: Option<DateTime<FixedOffset>>,
) -> () {
    let last_updated_at_value = 
        last_updated_at.unwrap_or(ad_state.update_info.ad_groups);
    let new_ad_groups = fetch_ad_groups(client, last_updated_at_value).await;
    println!("[new_ad_groups]: {:?}", new_ad_groups.len());
    update_ad_groups(ad_state, &new_ad_groups);
}
pub async fn fetch_and_update_creatives(
    ad_state: &mut AdState,
    client: Arc<PrismaClient>,
    last_updated_at: Option<DateTime<FixedOffset>>,
) -> () {
    let last_updated_at_value = 
        last_updated_at.unwrap_or(ad_state.update_info.creatives);
    let new_creatives = fetch_creatives(client, last_updated_at_value).await;
    println!("[new_creatives]: {:?}", new_creatives.len());
    update_creatives(ad_state, &new_creatives);
}
pub async fn fetch_and_update_contents(
    ad_state: &mut AdState,
    client: Arc<PrismaClient>,
    last_updated_at: Option<DateTime<FixedOffset>>,
) -> () {
    let last_updated_at_value = 
        last_updated_at.unwrap_or(ad_state.update_info.contents);
    let new_contents = fetch_contents(client, last_updated_at_value).await;
    println!("[new_contents]: {:?}", new_contents.len());
    update_contents(ad_state, &new_contents);
}
pub async fn fetch_and_update_content_types(
    ad_state: &mut AdState,
    client: Arc<PrismaClient>,
    last_updated_at: Option<DateTime<FixedOffset>>,
) -> () {
    let last_updated_at_value = 
        last_updated_at.unwrap_or(ad_state.update_info.content_types);
    let new_content_types = fetch_content_types(client, last_updated_at_value).await;
    println!("[new_content_typess]: {:?}", new_content_types.len());
    update_content_types(ad_state, &new_content_types);
}

// async fn fetch_and_update_providers(
//     ad_state: &mut AdState,
//     client: Arc<PrismaClient>,
//     last_updated_at: Option<DateTime<FixedOffset>>,
// ) -> () {
//     let last_updated_at_value = 
//         last_updated_at.unwrap_or(ad_state.update_info.providers);
//     let new_providers = fetch_providers(client, last_updated_at_value).await;
//     println!("[new_providers]: {:?}", new_providers.len());
//     update_providers(ad_state, &new_providers).await;
// }
// async fn fetch_and_update_integrations(
//     &mut self,
//     client: Arc<PrismaClient>,
//     last_updated_at: Option<DateTime<FixedOffset>>,
// ) -> () {
//     let last_updated_at_value = last_updated_at.unwrap_or(self.update_info.integrations);
//     let new_integrations = &Self::fetch_integrations(client, last_updated_at_value).await;
//     println!("[new_integrations]: {:?}", new_integrations.len());
//     self.update_integrations(new_integrations);
// }

pub async fn load(
    ad_state: &mut AdState, 
    client: Arc<PrismaClient>
) {
    fetch_and_update_services(ad_state, client.clone(), None).await;
    let placements = fetch_and_update_placements(ad_state, client.clone(), None).await;
    fetch_and_update_campaigns(ad_state, client.clone(), None).await;
    fetch_and_update_ad_groups(ad_state, client.clone(), None).await;
    fetch_and_update_creatives(ad_state, client.clone(), None).await;
    fetch_and_update_contents(ad_state, client.clone(), None).await;
    fetch_and_update_content_types(ad_state, client.clone(), None)
        .await;
    
    
    // integrations 
    let last_updated_at_value = 
        ad_state.update_info.integrations;
    let providers = fetch_providers(client, last_updated_at_value).await;
    let integrations = Integrations::new(&placements, &providers).await;
    ad_state.set_integrations(integrations);
    

    println!("{:?}", ad_state);
}
