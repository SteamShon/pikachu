use std::collections::HashMap;

use common::types::{CreativeWithContent, Stat};

#[derive(Debug, Clone, Default)]
pub struct ThompsonSamplingRanker {}

impl ThompsonSamplingRanker {
    pub fn apply<'a>(
        &self,
        creatives_stat: &'a HashMap<String, Stat>,
        candidates: Vec<CreativeWithContent<'a>>,
        k: usize,
    ) -> Vec<(CreativeWithContent<'a>, f32)> {
        let mut top_candidates = Vec::new();

        for candidate in candidates {
            let default_stat = Stat::default();
            let stat = creatives_stat
                .get(&candidate.creative.id)
                .unwrap_or(&default_stat);
            let score = stat.score().unwrap_or(0.0);

            top_candidates.push((candidate, score))
        }
        top_candidates.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        top_candidates.truncate(k);

        top_candidates
    }
}
