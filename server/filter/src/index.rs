use std::collections::{HashMap, HashSet};
use std::num::NonZeroUsize;
use std::sync::{Mutex, MutexGuard};

use lru::LruCache;
use serde_json::json;

use crate::filter::*;
use crate::filterable::Filterable;

#[derive(Debug)]
pub struct FilterIndex {
    pub all_dimensions: HashSet<String>,
    pub true_index: Mutex<LruCache<DimValue, HashSet<String>>>,
    pub false_index: Mutex<LruCache<DimValue, HashSet<String>>>,
}

impl FilterIndex {
    fn debug(&self) -> serde_json::Value {
        let mut true_index = Vec::new();
        let mut false_index = Vec::new();
        for (dim_value, ids) in self.true_index.lock().unwrap().iter() {
            true_index.push(json!({
                "dim_value": json!(dim_value),
                "ids": json!(ids),
            }));
        }
        for (dim_value, ids) in self.false_index.lock().unwrap().iter() {
            false_index.push(json!({
                "dim_value": json!(dim_value),
                "ids": json!(ids),
            }));
        }
        json!({
            "all_dimensions": json!(self.all_dimensions),
            "true_index": json!(true_index),
            "false_index": json!(false_index)
        })
    }
    fn build_all_dimensions<F>(filters: &Vec<F>) -> HashSet<String>
    where
        F: Filterable,
    {
        let mut dimensions = HashSet::new();
        for filter in filters {
            for target_filter in filter.filter() {
                dimensions.extend(extract_dimensions(&target_filter));
            }
        }
        dimensions
    }

    fn new<F>(filters: &Vec<F>) -> FilterIndex
    where
        F: Filterable,
    {
        let all_dimensions = Self::build_all_dimensions(filters);
        let mut true_index = LruCache::new(NonZeroUsize::new(1000).unwrap());
        let mut false_index = LruCache::new(NonZeroUsize::new(1000).unwrap());

        for filter in filters {
            for target_filter in filter.filter() {
                let target_keys = build_target_keys(&target_filter);

                for (index, target_key) in target_keys.iter().enumerate() {
                    let mut value_existing_dimensions = HashSet::new();
                    let internal_id = format!("{id}_{seq}", id = filter.id(), seq = index);

                    // fill out index with dimension that has values.
                    for dv in &target_key.dim_values {
                        value_existing_dimensions.insert(dv.dimension.clone());

                        if dv.is_not {
                            let ids = false_index.get_or_insert_mut(dv.clone(), || HashSet::new());
                            ids.insert(filter.id().to_string());
                        } else {
                            let ids = true_index.get_or_insert_mut(dv.clone(), || HashSet::new());
                            ids.insert(internal_id.clone());
                        };
                    }
                    // fill out index for dimension that don't have values. empty.
                    for dimension in &all_dimensions - &value_existing_dimensions {
                        let dv = DimValue::new(&dimension, "empty", false);

                        let ids = true_index.get_or_insert_mut(dv, || HashSet::new());
                        ids.insert(internal_id.clone());
                    }
                }
            }
        }
        FilterIndex {
            all_dimensions,
            true_index: Mutex::new(true_index),
            false_index: Mutex::new(false_index),
        }
    }

    fn generate_dimension_candidates(
        user_info: &UserInfo,
        dimension: &String,
        index: &mut MutexGuard<LruCache<DimValue, HashSet<String>>>,
    ) -> HashSet<String> {
        let mut union: HashSet<String> = HashSet::new();
        // empty key need to be lookup.
        let empty_dim_value = DimValue::new(dimension, "empty", false);
        for internal_ids in index.get(&empty_dim_value) {
            for internal_id in internal_ids {
                union.insert(internal_id.clone());
            }
        }
        for values in user_info.get(dimension) {
            for value in values {
                let dim_value = DimValue::new(dimension, value, false);
                for internal_ids in index.get(&dim_value) {
                    for internal_id in internal_ids {
                        union.insert(internal_id.clone());
                    }
                }
            }
        }
        union
    }
    fn to_ids(internal_ids: &HashSet<String>) -> HashSet<String> {
        let mut ids = HashSet::new();
        for internal_id in internal_ids {
            ids.insert(internal_id.clone());
        }
        ids
    }
    fn search_positive_internal_ids(&self, user_info: &UserInfo) -> Option<HashSet<String>> {
        let mut true_index = self.true_index.lock().unwrap();
        let mut positive_candidates: Option<HashSet<String>> = None;

        for dimension in &self.all_dimensions {
            let dim_candidates =
                Self::generate_dimension_candidates(user_info, dimension, &mut true_index);
            let intersections = positive_candidates
                .map(|prev| {
                    let mut intersections: HashSet<String> = HashSet::new();
                    for common_internal_id in prev.intersection(&dim_candidates) {
                        intersections.insert(common_internal_id.clone());
                    }
                    intersections
                })
                .unwrap_or(dim_candidates);
            positive_candidates = Some(intersections);
        }
        positive_candidates
    }
    fn search_negative_ids(&self, user_info: &UserInfo) -> HashSet<String> {
        let mut false_index = self.false_index.lock().unwrap();
        let mut negative_candidates: HashSet<String> = HashSet::new();

        for (dim, values) in user_info {
            let dim_candidates =
                Self::generate_dimension_candidates(user_info, dim, &mut false_index);
            negative_candidates.extend(dim_candidates);
        }

        negative_candidates
    }
    fn search(&self, user_info: &UserInfo) -> HashSet<String> {
        let positive_candidates = self.search_positive_internal_ids(user_info);
        let negative_candidates = self.search_negative_ids(user_info);

        let matched_ids =
            &Self::to_ids(&positive_candidates.unwrap_or(HashSet::new())) - &negative_candidates;

        matched_ids
    }
}

#[cfg(test)]
#[path = "./index_test.rs"]
mod index_test;
