use std::collections::HashMap;

use filter::filter::UserInfo;
use rand_chacha::ChaCha8Rng;
use rand_distr::{Distribution, Beta};
use rand::SeedableRng;
use serde::Deserialize;

pub trait Rankable {
    fn ident(&self) -> String;
}

#[derive(Debug, Clone, Deserialize)]
pub struct Stat {
    pub positive_counts: u32,
    pub negative_counts: u32,
}
impl Default for Stat {
    fn default() -> Self {
        Self { 
            positive_counts: Default::default(), 
            negative_counts: Default::default() 
        }
    }
}
impl Stat {
    pub fn score(&self) -> Option<f32> {
        let alpha = 1.0 + (self.positive_counts as f32);
        let beta = 1.0 + (self.negative_counts as f32);

        Self::beta_sample(alpha, beta)
    }
    pub fn rng(seed: u64) -> ChaCha8Rng {
        rand_chacha::ChaCha8Rng::seed_from_u64(seed)
    }
    pub fn beta_sample(alpha: f32, beta: f32) -> Option<f32> {
        let rng = &mut Self::rng(1);

        Beta::new(alpha, beta).ok().map(|beta| beta.sample(rng))
    }
    pub fn update(&mut self, positive_count: u32, negative_count: u32) {
        self.positive_counts += positive_count;
        self.negative_counts += negative_count;
    }
    pub fn merge(&mut self, other: &Stat) {
        self.positive_counts += other.positive_counts;
        self.negative_counts += other.negative_counts;
    }
}
pub struct Feedback<A: Rankable> {
    pub arm: A,
    pub reward: Stat
}
pub trait Ranker<A> where A : Rankable {
    fn rank(&self, user_info: &UserInfo, candidates: &Vec<A>, k: usize) -> Vec<(A, f32)>;
    fn update(&mut self, feedbacks: &Vec<Feedback<A>>);
}

#[derive(Debug, Clone)]
pub struct DefaultRanker<A: Rankable + Clone> {
    pub arms: HashMap<String, A>,
    pub arm_id_stat: HashMap<String, Stat>,
    pub default_top_k: usize,
}
impl<A: Rankable + Clone> Default for DefaultRanker<A> {
    fn default() -> Self {
        Self { 
            arm_id_stat: Default::default(), 
            arms: Default::default(), 
            default_top_k: 1 
        }
    }
}
impl<A: Rankable + Clone> Ranker<A> for DefaultRanker<A> {
    fn rank(&self, _user_info: &UserInfo, candidates: &Vec<A>, k: usize) -> Vec<(A, f32)> {
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
    fn update(&mut self, feedbacks: &Vec<Feedback<A>>) {
        for feedback in feedbacks {
            let id = feedback.arm.ident();
            self.arms.insert(id, feedback.arm.clone());
            
            let prev_stat = self.arm_id_stat.entry(feedback.arm.ident()).or_insert(Stat::default());
            prev_stat.merge(&feedback.reward);
        }
    }

}
impl<A: Rankable + Clone> DefaultRanker<A> {
    pub fn add_arm(&mut self, arm: &A) {
        self.arms.insert(arm.ident(), arm.clone());
        self.arm_id_stat.insert(arm.ident(), Stat::default());
    }
}

#[cfg(test)]
#[path = "./ranker_test.rs"]
mod ranker_test;