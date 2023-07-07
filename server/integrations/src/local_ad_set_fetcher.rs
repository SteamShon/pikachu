use common::{db::ad_set, types::UserInfo, util::is_active_ad_set};
use filter::index::FilterIndex;
use std::collections::HashMap;

#[derive(Debug, Clone, Default)]
pub struct LocalAdSetFetcher {}

impl LocalAdSetFetcher {
    pub async fn apply<'a>(
        &self,
        ad_set_index: &'a HashMap<String, FilterIndex>,
        ad_sets: &'a HashMap<String, ad_set::Data>,
        placement_id: &str,
        user_info: &UserInfo,
    ) -> Option<Vec<&'a ad_set::Data>> {
        let mut result = Vec::new();
        let index = ad_set_index.get(placement_id)?;
        let ad_set_ids = index.search(&user_info);

        for ad_set_id in ad_set_ids {
            if let Some(ad_set) = ad_sets.get(ad_set_id) {
                if is_active_ad_set(ad_set) {
                    result.push(ad_set);
                }
            }
        }

        Some(result)
    }
}
