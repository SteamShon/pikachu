
use std::collections::HashMap;
use common::{types::{UserInfo, Feedback, Rankable, Stat}};

#[derive(Debug, Clone)]
pub struct ThompsonSamplingRanker {
    // pub arms: HashMap<String, A>,
    pub arm_id_stat: HashMap<String, Stat>,
    pub default_top_k: usize,
}
impl Default for ThompsonSamplingRanker {
    fn default() -> Self {
        Self { 
            arm_id_stat: Default::default(), 
            arms: Default::default(), 
            default_top_k: 1 
        }
    }
} 
impl ThompsonSamplingRanker {
    fn update<A: Rankable>(&mut self, feedbacks: &Vec<Feedback<A>>) {
        for feedback in feedbacks {
            let id = feedback.arm.ident();
            self.arms.insert(id, feedback.arm.clone());
            
            let prev_stat = self.arm_id_stat.entry(feedback.arm.ident()).or_insert(Stat::default());
            prev_stat.merge(&feedback.reward);
        }
    }
    pub fn apply(
        &self, 
        user_info: &UserInfo, 
        candidates: &Vec<A>, 
        k: usize
    ) -> Vec<(A, f32)> {
        let mut top_actions: Vec<(A, f32)> = Vec::new();
        for candidate in candidates {
            let id = candidate.ident();
            let default = Stat::default();
            let stat = self.arm_id_stat.get(&id).unwrap_or(&default);
            let score = stat.score().unwrap_or(0.0);
            
            top_actions.push((candidate.clone(), score))
        }
        top_actions.sort_by(|a, b| b.1.partial_cmp(
            &a.1).unwrap());
            top_actions.truncate(k);

        top_actions
    }
}
