use crate::db::{
    ad_group, campaign, content, creative, cube, cube_config, placement, placement_group, service,
    PrismaClient,
};
use fasthash::*;
use jsonlogic_rs;

use lru::LruCache;
use serde::Serialize;
use serde_json::{from_str, json, Value as JValue};
use std::borrow::BorrowMut;
use std::cell::RefCell;
use std::num::NonZeroUsize;
use std::rc::Rc;
use std::sync::Arc;
pub enum Error {
    InvalidFilterError(serde_json::Error),
    JsonLogicError,
}
pub struct Context {
    pub client: Arc<PrismaClient>,
}

#[derive(Debug, Serialize)]
pub struct AdResponse {
    pub placement_id: String,
    pub campaign_id: String,
    pub ad_groups: Vec<ad_group::Data>,
}
pub struct LocalCachedAdMeta {
    pub cache: RefCell<LruCache<u64, RefCell<Vec<placement::Data>>>>,
}
unsafe impl Send for LocalCachedAdMeta {}
unsafe impl Sync for LocalCachedAdMeta {}

impl LocalCachedAdMeta {
    pub fn new() -> LocalCachedAdMeta {
        LocalCachedAdMeta {
            cache: RefCell::new(LruCache::new(NonZeroUsize::new(1000).unwrap())),
        }
    }
    pub fn to_cache_key(service_id: &str, placement_group_id: &str) -> u64 {
        city::hash64(format!("{}{}", service_id, placement_group_id))
    }
    // pub fn to_cache_key(service: &service::Data, placement_group: &placement_group::Data) -> u64 {
    //     city::hash64(format!("{}{}", service.id, placement_group.id))
    // }
    pub async fn load(&self, ctx: Context) -> () {
        let services: Vec<service::Data> = ctx
            .client
            .service()
            .find_many(vec![])
            .with(service::placement_groups::fetch(vec![]).with(
                placement_group::placements::fetch(vec![]).with(
                    placement::campaigns::fetch(vec![]).with(
                        campaign::ad_groups::fetch(vec![]).with(
                            ad_group::creatives::fetch(vec![]).with(
                                creative::content::fetch().with(content::content_type::fetch()),
                            ),
                        ),
                    ),
                ),
            ))
            .with(service::cube_configs::fetch(vec![]).with(cube_config::cubes::fetch(vec![])))
            .exec()
            .await
            .unwrap();

        let mut cache = (&self.cache).borrow_mut();
        for service in &services {
            for placement_group in service.placement_groups().unwrap() {
                let key = LocalCachedAdMeta::to_cache_key(&service.id, &placement_group.id);
                let placements = placement_group.placements().unwrap();
                let mut vec = cache
                    .get_or_insert(key, || RefCell::new(Vec::new()))
                    .borrow_mut();
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
    ) -> Vec<AdResponse> {
        let mut ad_responses = Vec::<AdResponse>::new();
        let mut cache = (&self.cache).borrow_mut();
        let key = LocalCachedAdMeta::to_cache_key(service_id, placement_group_id);
        let placements_opt = cache.get(&key);
        if let None = placements_opt {
            return ad_responses;
        }
        let placements = placements_opt.unwrap().borrow();
        for placement in placements.iter() {
            for campaign in placement.campaigns().unwrap() {
                let mut filtered = Vec::<ad_group::Data>::new();
                let ad_groups = campaign.ad_groups().unwrap();
                for ad_group in ad_groups {
                    if let Ok(matched) = LocalCachedAdMeta::filter_ad_group(ad_group, user_info) {
                        if matched {
                            filtered.push(ad_group.clone())
                        }
                    }
                }
                ad_responses.push(AdResponse {
                    placement_id: placement.id.clone(),
                    campaign_id: campaign.id.clone(),
                    ad_groups: filtered,
                });
            }
        }
        ad_responses
    }
}
