
use std::collections::HashMap;

use common::{types::{Stat}, db::ad_set, util::is_active_ad_set};

#[derive(Debug, Clone, Default)]
pub struct AdSetThompsonSamplingRanker {
    
}

impl AdSetThompsonSamplingRanker {
    pub fn apply<'a>(
        &self, 
        ad_sets_stat: &'a HashMap<String, Stat>,
        candidates: Vec<&'a ad_set::Data>, 
        k: usize,
    ) -> Vec<(&'a ad_set::Data, f32)> {
        let mut top_candidates = Vec::new();

        for candidate in candidates {
            if !is_active_ad_set(candidate) {
                continue;
            }
            
            let default_stat = Stat::default();
            let stat = ad_sets_stat
                .get(&candidate.id)
                .unwrap_or(&default_stat);
            let score = stat.score().unwrap_or(0.0);
            
            top_candidates.push((candidate, score))
        }
        top_candidates.sort_by(|a, b| b.1.partial_cmp(
            &a.1).unwrap());
        top_candidates.truncate(k);

        top_candidates
    }
}
