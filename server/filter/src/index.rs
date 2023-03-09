use serde_json::json;
use std::borrow::Borrow;
use std::collections::{HashMap, HashSet};

use crate::filter::*;
use crate::filterable::Filterable;

#[derive(Debug, Clone)]
pub struct FilterIndex {
    pub all_dimensions: HashSet<String>,
    pub ids: HashMap<String, TargetFilter>,
    pub index: HashMap<DimValue, HashSet<String>>,
    pub non_filter_ids: HashSet<String>,
}
impl Default for FilterIndex {
    fn default() -> Self {
        Self {
            all_dimensions: Default::default(),
            ids: Default::default(),
            index: Default::default(),
            non_filter_ids: Default::default(),
        }
    }
}
impl FilterIndex {
    pub fn debug_index(&self) -> serde_json::Value {
        let mut index = HashMap::new();
        for (dim_value, ids) in self.index.iter() {
            let mut sorted_ids = Vec::from_iter(ids.iter());
            sorted_ids.sort();

            index.insert(dim_value.debug(), sorted_ids);
        }
        json!(index)
    }
    pub fn debug(&self) -> serde_json::Value {
        json!({
            "all_dimensions": json!(&self.all_dimensions),
            "ids": json!(&self.ids),
            "index": self.debug_index(),
            "non_filter_ids": json!(&self.non_filter_ids.borrow()),
        })
    }
    fn build_all_dimensions<F>(filters: &Vec<F>) -> HashSet<String>
    where
        F: Filterable,
    {
        let mut dimensions = HashSet::new();
        for filter in filters {
            for target_filter in filter.filter() {
                dimensions.extend(TargetFilter::extract_dimensions(&target_filter));
            }
        }
        dimensions
    }

    fn update_all_dimensions<F>(&mut self, filters: &Vec<F>)
    where
        F: Filterable,
    {
        let all_dimensions = &mut self.all_dimensions;
        all_dimensions.extend(Self::build_all_dimensions(filters));
    }
    fn update_non_filter_ids<F>(&mut self, filters: &Vec<F>)
    where
        F: Filterable,
    {
        let non_filter_ids = &mut self.non_filter_ids;
        for filter in filters {
            if let None = filter.filter() {
                non_filter_ids.insert(filter.id().clone());
            }
        }
    }
    fn update_ids<F>(&mut self, filters: &Vec<F>)
    where
        F: Filterable,
    {
        let ids = &mut self.ids;
        for filter in filters {
            for target_filter in filter.filter() {
                ids.insert(filter.id(), target_filter);
            }
        }
    }
    fn cleaup_index<F>(&mut self, filters: &Vec<F>)
    where
        F: Filterable,
    {
        let prev_ids = &mut self.ids;
        let prev_all_dimensions = &mut self.all_dimensions;
        let prev_index = &mut self.index;

        for filter in filters {
            for prev_target_filter in prev_ids.get(&filter.id()) {
                let index_key_with_internal_ids = TargetFilter::build_index_key_wth_internal_ids(
                    &prev_all_dimensions,
                    prev_target_filter,
                    &filter.id(),
                );
                for (dv, internal_id) in index_key_with_internal_ids {
                    for prev_ids in prev_index.get_mut(&dv) {
                        prev_ids.remove(&internal_id);
                    }
                }
            }
        }
    }
    fn update_index<F>(&mut self, filters: &Vec<F>)
    where
        F: Filterable,
    {
        let all_dimensons = &mut self.all_dimensions;
        let index = &mut self.index;

        for filter in filters {
            for target_filter in filter.filter() {
                let index_key_with_internal_ids = TargetFilter::build_index_key_wth_internal_ids(
                    &all_dimensons,
                    &target_filter,
                    &filter.id(),
                );
                for (dv, internal_id) in index_key_with_internal_ids {
                    index
                        .entry(dv)
                        .or_insert_with(|| HashSet::new())
                        .insert(internal_id);
                }
            }
        }
    }
    pub fn update<F>(&mut self, filters: &Vec<F>) -> ()
    where
        F: Filterable,
    {
        println!("[Before]: {:?}", self.debug());
        self.update_all_dimensions(filters);
        self.update_non_filter_ids(filters);

        self.cleaup_index(filters);

        self.update_index(filters);
        self.update_ids(filters);

        println!("[After]: {:?}", self.debug());
    }

    fn generate_dimension_candidates(
        user_info: &UserInfo,
        dimension: &String,
        index: &HashMap<DimValue, HashSet<String>>,
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
            if let Some((id, _seq)) = internal_id.rsplit_once("_") {
                ids.insert(String::from(id));
            }
        }
        ids
    }
    fn search_positive_internal_ids(&self, user_info: &UserInfo) -> Option<HashSet<String>> {
        let all_dimensions = &self.all_dimensions;
        let true_index = &self.index;
        let mut positive_candidates: Option<HashSet<String>> = None;

        for dimension in all_dimensions.iter() {
            let dim_candidates =
                Self::generate_dimension_candidates(user_info, dimension, true_index, false);
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
        let index = &self.index;
        let mut union: HashSet<String> = HashSet::new();

        for (dim, _values) in user_info {
            let dim_candidates = Self::generate_dimension_candidates(user_info, dim, &index, true);
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
