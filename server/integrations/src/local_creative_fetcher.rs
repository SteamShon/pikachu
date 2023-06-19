
use std::collections::{HashMap, HashSet};
use common::{types::UserInfo, db::creative};
use filter::index::FilterIndex;

/**
 * Lookup creatives for requested placement on 
 * local memory, which has been populated periodically
 * by fetching remote database updated record
 */
#[derive(Debug, Clone)]
pub struct LocalCreativeFetcher {
    
}

impl LocalCreativeFetcher {
    pub fn ad_group_ids_to_creatives<'a: 'b, 'b>(
        ad_group_ids: HashSet<&'b str>,
        ad_group_creatives: &'a HashMap<String, HashMap<String, creative::Data>>
    ) -> HashMap<&'b str, &'a HashMap<String, creative::Data>> {
        let mut aggr = HashMap::new();
        for ad_group_id in ad_group_ids {
            if let Some((key, creatives)) = ad_group_creatives.get_key_value(ad_group_id) {
                aggr.insert(key.as_str(), creatives);                
            }
        }
        aggr
    }
    pub async fn apply<'a>(
        &self, 
        filter_index: &'a HashMap<String, FilterIndex>,
        ad_group_creatives: &'a HashMap<String, HashMap<String, creative::Data>>,
        placement_id: &str, 
        user_info: &UserInfo,
    ) -> Option<HashMap<&'a str, &'a HashMap<String, creative::Data>>> {
        let index = filter_index.get(placement_id)?;
        let ad_group_ids = index.search(&user_info);
        let tree = 
            Self::ad_group_ids_to_creatives(ad_group_ids, ad_group_creatives);
        
        
        Some(tree)
    }
}
