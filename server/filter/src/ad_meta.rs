use crate::db::{
    ad_group, campaign, content_type, creative, cube_config, placement, placement_group, service,
    PrismaClient,
};
use fasthash::*;
use jsonlogic_rs;

use lru::LruCache;
use serde::Serialize;
use serde_json::Value as JValue;
use std::num::NonZeroUsize;
use std::sync::Arc;
use std::sync::Mutex;
pub enum Error {
    InvalidFilterError(serde_json::Error),
    JsonLogicError,
}
pub struct Context {
    pub client: Arc<PrismaClient>,
}

#[derive(Debug, Serialize)]
pub struct Campaign {
    pub info: campaign::Data,
    pub ad_groups: Vec<ad_group::Data>,
}
#[derive(Debug, Serialize)]
pub struct Placement {
    pub info: placement::Data,
    pub content_type: content_type::Data,
    pub campaigns: Vec<Campaign>,
}
pub struct AdMeta {
    pub cache: Mutex<LruCache<u64, Mutex<Vec<placement::Data>>>>,
}
impl AdMeta {
    pub fn new() -> AdMeta {
        AdMeta {
            cache: Mutex::new(LruCache::new(NonZeroUsize::new(1000).unwrap())),
        }
    }
    pub fn to_cache_key(service_id: &str, placement_group_id: &str) -> u64 {
        city::hash64(format!("{}{}", service_id, placement_group_id))
    }
    pub async fn load(&self, ctx: Context) -> () {
        let services: Vec<service::Data> = ctx
            .client
            .service()
            .find_many(vec![])
            .with(
                service::placement_groups::fetch(vec![]).with(
                    placement_group::placements::fetch(vec![])
                        .with(placement::content_type::fetch())
                        .with(placement::campaigns::fetch(vec![]).with(
                            campaign::ad_groups::fetch(vec![]).with(
                                ad_group::creatives::fetch(vec![]).with(creative::content::fetch()),
                            ),
                        )),
                ),
            )
            .with(service::cube_configs::fetch(vec![]).with(cube_config::cubes::fetch(vec![])))
            .exec()
            .await
            .unwrap();

        let mut cache = (&self.cache).lock().unwrap();
        for service in &services {
            for placement_group in service.placement_groups().unwrap() {
                let key = AdMeta::to_cache_key(&service.id, &placement_group.id);
                let placements = placement_group.placements().unwrap();
                let mut vec = cache
                    .get_or_insert(key, || Mutex::new(Vec::new()))
                    .lock()
                    .unwrap();
                vec.clear();
                for placement in placements {
                    vec.push(placement.clone());
                }
            }
        }
    }
    fn filter_ad_group(ad_group: &ad_group::Data, user_info: &JValue) -> Result<bool, Error> {
        match &ad_group.filter {
            None => Ok(true),
            Some(filter) => {
                let rule: Result<JValue, _> = serde_json::from_str(filter);
                match rule {
                    Ok(logic) => {
                        let matched = jsonlogic_rs::apply(&logic, &user_info);
                        match matched {
                            Ok(result) => Ok(result.as_bool().unwrap()),
                            Err(_) => Err(Error::JsonLogicError),
                        }
                    }
                    Err(error) => Err(Error::InvalidFilterError(error)),
                }
            }
        }
    }
    pub fn filter_ad_meta(
        &self,
        service_id: &str,
        placement_group_id: &str,
        user_info: &JValue,
    ) -> Vec<Placement> {
        let mut ad_responses = Vec::<Placement>::new();
        let mut cache = (&self.cache).lock().unwrap();
        let key = AdMeta::to_cache_key(service_id, placement_group_id);
        let placements_opt = cache.get(&key);
        if let None = placements_opt {
            return ad_responses;
        }
        let placements = placements_opt.unwrap().lock().unwrap();
        for placement in placements.iter() {
            let mut campaigns = Vec::<Campaign>::new();
            for campaign in placement.campaigns().unwrap() {
                let mut ad_groups = Vec::<ad_group::Data>::new();
                for ad_group in campaign.ad_groups().unwrap() {
                    if let Ok(matched) = AdMeta::filter_ad_group(ad_group, user_info) {
                        if matched {
                            ad_groups.push(ad_group.clone())
                        }
                    }
                }
                campaigns.push(Campaign {
                    info: campaign.clone(),
                    ad_groups,
                })
            }
            ad_responses.push(Placement {
                info: placement.clone(),
                content_type: placement.content_type().unwrap().clone(),
                campaigns,
            })
        }
        ad_responses
    }
}
