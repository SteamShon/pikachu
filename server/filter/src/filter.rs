use crate::db::{
    ad_group, campaign, content, creative, cube, cube_config, placement, placement_group, service,
    PrismaClient,
};
use jsonlogic_rs;
use serde_json::{from_str, json, Value as JValue};
use std::sync::Arc;
pub struct Context {
    pub client: Arc<PrismaClient>,
}

pub struct LocalCachedAdMeta {
    pub services: Vec<service::Data>,
}
impl LocalCachedAdMeta {
    pub async fn load(ctx: Context) -> LocalCachedAdMeta {
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

        LocalCachedAdMeta { services: services }
    }
}

pub fn filter_ad_meta<'a>(
    ad_meta: &'a LocalCachedAdMeta,
    user_info: JValue,
    filtered: &mut Vec<&'a ad_group::Data>,
) -> () {
    for service in &ad_meta.services {
        for placement_group in service.placement_groups().unwrap() {
            for placement in placement_group.placements().unwrap() {
                for campaign in placement.campaigns().unwrap() {
                    for ad_group in campaign.ad_groups().unwrap() {
                        if let None = ad_group.filter {
                            continue;
                        }
                        let filter = ad_group.filter.as_ref().unwrap();
                        let json_logic: JValue = serde_json::from_str(filter).unwrap();

                        let matched = jsonlogic_rs::apply(&json_logic, &user_info)
                            .map(|v| v.as_bool().unwrap())
                            .unwrap_or(false);

                        if matched {
                            filtered.push(ad_group);
                        }
                    }
                }
            }
        }
    }
}
/*
 fn build_tree(services: &Vec<service::Data>) {
    let mut tree = HashMap::<
        &service::Data,
        HashMap<&placement_group::Data, HashMap<&placement::Data, HashMap<&campaign::Data, bool>>>,
    >::new();
    for service in services {
        if let None = tree.get(&service) {
            tree.insert(&service, HashMap::new());
        }

        let placement_groups = tree.get_mut(&service).unwrap();
        if let Err(error) = service.placement_groups() {
            continue;
        }
        for placement_group in service.placement_groups().unwrap() {
            if let None = placement_groups.get(placement_group) {
                placement_groups.insert(&placement_group, HashMap::new());
            }
            let placements = placement_groups.get_mut(&placement_group).unwrap();

            if let Err(error) = placement_group.placements() {
                continue;
            }
            for placement in placement_group.placements().unwrap() {
                if let None = placements.get(placement) {
                    placements.insert(&placement, HashMap::new());
                }
                let campaigns = placements.get_mut(&placement).unwrap();
                if let Err(error) = placement.campaigns() {
                    continue;
                }

                for campaign in placement.campaigns().unwrap() {
                    if let None = campaigns.get(campaign) {
                        campaigns.insert(&campaign, true);
                    }
                }
            }
        }
    }
    println!("tree: {:?}", tree);
}
 */
