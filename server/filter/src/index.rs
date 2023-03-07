use std::borrow::Borrow;
use std::collections::{HashMap, HashSet};
use std::num::NonZeroUsize;
use std::sync::{Arc, Mutex, MutexGuard};

use lru::LruCache;
use serde_json::json;

use crate::filter::*;
use crate::filterable::Filterable;

#[derive(Debug)]
pub struct FilterIndex {
    pub all_dimensions: Mutex<HashSet<String>>,
    pub index: Mutex<LruCache<DimValue, HashSet<String>>>,
    pub non_filter_ids: Mutex<HashSet<String>>,
}
impl Default for FilterIndex {
    fn default() -> Self {
        Self {
            all_dimensions: Default::default(),
            index: Mutex::new(LruCache::new(NonZeroUsize::new(100000).unwrap())),
            non_filter_ids: Default::default(),
        }
    }
}
impl FilterIndex {
    fn debug_index(binding: &MutexGuard<LruCache<DimValue, HashSet<String>>>) -> serde_json::Value {
        let mut index = HashMap::new();
        for (dim_value, ids) in binding.iter() {
            let mut sorted_ids = Vec::from_iter(ids.iter());
            sorted_ids.sort();

            index.insert(dim_value.debug(), sorted_ids);
        }
        json!(index)
    }
    pub fn debug(&self) -> serde_json::Value {
        let true_binding = self.index.lock().unwrap();

        json!({
            "all_dimensions": json!(self.all_dimensions),
            "index": Self::debug_index(&true_binding),
            "non_filter_ids": json!(self.non_filter_ids.borrow()),
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
    fn build_index<F>(
        filters: &Vec<F>,
    ) -> (
        HashSet<String>,
        LruCache<DimValue, HashSet<String>>,
        HashSet<String>,
    )
    where
        F: Filterable,
    {
        let all_dimensions = Self::build_all_dimensions(filters);
        let mut current_index = LruCache::new(NonZeroUsize::new(100000).unwrap());
        let mut non_filter_ids = HashSet::new();

        for filter in filters {
            if let None = filter.filter() {
                non_filter_ids.insert(filter.id().clone());
            }
            for target_filter in filter.filter() {
                let target_keys = build_target_keys(&target_filter);

                for (index, target_key) in target_keys.iter().enumerate() {
                    let mut value_existing_dimensions = HashSet::new();
                    let internal_id = format!("{id}_{seq}", id = filter.id(), seq = index);

                    // fill out index with dimension that has values.
                    for dv in &target_key.dim_values {
                        value_existing_dimensions.insert(dv.dimension.clone());

                        let ids = current_index.get_or_insert_mut(dv.clone(), || HashSet::new());
                        if dv.is_not {
                            ids.insert(filter.id().to_string());
                        } else {
                            ids.insert(internal_id.clone());
                        };
                    }
                    // fill out index for dimension that don't have values. empty.
                    for dimension in &all_dimensions - &value_existing_dimensions {
                        let dv = DimValue::new(&dimension, "empty", false);

                        let ids = current_index.get_or_insert_mut(dv, || HashSet::new());
                        ids.insert(internal_id.clone());
                    }
                }
            }
        }

        (all_dimensions, current_index, non_filter_ids)
    }
    pub fn update<F>(&mut self, filters: &Vec<F>) -> ()
    where
        F: Filterable,
    {
        let (all_dimensions, current_index, non_filter_ids) = Self::build_index(filters);
        self.all_dimensions.lock().unwrap().extend(all_dimensions);

        let mut index = self.index.lock().unwrap();
        for (dim_value, ids) in current_index {
            let current = index.get_or_insert_mut(dim_value, || HashSet::new());
            current.extend(ids);
        }

        self.non_filter_ids.lock().unwrap().extend(non_filter_ids);
    }

    pub fn new<F>(filters: &Vec<F>) -> FilterIndex
    where
        F: Filterable,
    {
        let (all_dimensions, current_index, non_filter_ids) = Self::build_index(filters);
        FilterIndex {
            all_dimensions: Mutex::new(all_dimensions),
            index: Mutex::new(current_index),
            non_filter_ids: Mutex::new(non_filter_ids),
        }
    }

    fn generate_dimension_candidates(
        user_info: &UserInfo,
        dimension: &String,
        index: &mut MutexGuard<LruCache<DimValue, HashSet<String>>>,
        is_not: bool,
    ) -> HashSet<String> {
        let mut union: HashSet<String> = HashSet::new();
        // empty key need to be lookup.
        let empty_dim_value = DimValue::new(dimension, "empty", is_not);
        for internal_ids in index.get(&empty_dim_value) {
            for internal_id in internal_ids {
                union.insert(internal_id.clone());
            }
        }
        for values in user_info.get(dimension) {
            for value in values {
                let dim_value = DimValue::new(dimension, value, is_not);
                for internal_ids in index.get(&dim_value) {
                    for internal_id in internal_ids {
                        union.insert(internal_id.clone());
                    }
                }
            }
        }
        //println!("{:?} {:?} candidates {:?}", is_not, dimension, union);
        union
    }
    fn to_ids(internal_ids: &HashSet<String>) -> HashSet<String> {
        let mut ids = HashSet::new();
        for internal_id in internal_ids {
            for id in internal_id.split("_").nth(0) {
                ids.insert(String::from(id));
            }
        }
        ids
    }
    fn search_positive_internal_ids(&self, user_info: &UserInfo) -> Option<HashSet<String>> {
        let all_dimensions = self.all_dimensions.lock().unwrap();
        let mut true_index = self.index.lock().unwrap();
        let mut positive_candidates: Option<HashSet<String>> = None;

        for dimension in all_dimensions.iter() {
            let dim_candidates =
                Self::generate_dimension_candidates(user_info, dimension, &mut true_index, false);
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

        //println!("positive candidates: {:?}", positive_candidates);
        positive_candidates
    }
    fn search_negative_ids(&self, user_info: &UserInfo) -> HashSet<String> {
        let mut index = self.index.lock().unwrap();
        let mut union: HashSet<String> = HashSet::new();

        for (dim, _values) in user_info {
            let dim_candidates =
                Self::generate_dimension_candidates(user_info, dim, &mut index, true);
            union.extend(dim_candidates);
        }

        union
    }
    pub fn search(&self, user_info: &UserInfo) -> HashSet<String> {
        let positive_candidates = self.search_positive_internal_ids(user_info);
        let negative_candidates = self.search_negative_ids(user_info);

        let matched_ids =
            &Self::to_ids(&positive_candidates.unwrap_or(HashSet::new())) - &negative_candidates;

        //println!("index search: {:?}", matched_ids);
        matched_ids
    }
}

#[cfg(test)]
#[path = "./index_test.rs"]
mod index_test;
