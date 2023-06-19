
use std::collections::{HashMap, HashSet};
use rand::SeedableRng;
use rand_chacha::ChaCha8Rng;
use rand_distr::{Beta, Distribution};
use serde::{Serialize, Deserialize};

use crate::db::{content, creative, ad_group, campaign, placement, ad_set};

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize)]
pub struct DimValue {
    pub dimension: String,
    pub value: String,
    pub is_not: bool,
}
impl DimValue {
    pub fn debug(&self) -> String {
        format!(
            "{is_not}.{dimension}.{value}",
            is_not = self.is_not,
            dimension = self.dimension,
            value = self.value
        )
    }
    pub fn new(dim: &str, value: &str, is_not: bool) -> Self {
        DimValue {
            dimension: String::from(dim),
            value: String::from(value),
            is_not,
        }
    }
}
pub type UserInfo = HashMap<String, HashSet<String>>;


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

#[derive(Serialize, Debug)]
pub struct AdSetWithContent<'a> {
    pub ad_set: &'a ad_set::Data, 
    pub content: &'a content::Data
}
#[derive(Serialize, Debug)]
pub struct CreativeWithContent<'a> {
    pub creative: &'a creative::Data, 
    pub content: &'a content::Data
}
#[derive(Serialize, Debug)]
pub struct AdGroupCreatives<'a> {
    pub ad_group: &'a ad_group::Data, 
    pub creatives: Vec<CreativeWithContent<'a>>
}
#[derive(Serialize, Debug)]
pub struct CampaignAdGroups<'a> {
    pub campaign: &'a campaign::Data, 
    pub ad_groups: Vec<AdGroupCreatives<'a>>
}
#[derive(Serialize, Debug)]
pub struct PlacementCampaigns<'a> {
    pub placement: &'a placement::Data, 
    pub campaigns: Vec<CampaignAdGroups<'a>>
}