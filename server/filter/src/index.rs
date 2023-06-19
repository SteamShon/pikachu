use common::types::{DimValue, UserInfo};
use serde_json::json;
use std::borrow::Borrow;
use std::collections::{HashMap, HashSet};

use crate::filter::*;
use crate::filterable::Filterable;

#[derive(Debug, Clone)]
pub struct FilterIndex {
    pub all_dimensions: HashMap<String, HashSet<String>>,
    pub filters: HashMap<String, TargetFilter>,
    pub index: HashMap<DimValue, HashSet<String>>,
    pub non_filter_ids: HashSet<String>,
}
impl Default for FilterIndex {
    fn default() -> Self {
        Self {
            all_dimensions: Default::default(),
            filters: Default::default(),
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
            "ids": json!(&self.filters),
            "index": self.debug_index(),
            "non_filter_ids": json!(&self.non_filter_ids.borrow()),
        })
    }
    fn build_all_dimensions<F>(filters: &Vec<F>) -> HashMap<String, HashSet<String>>
    where
        F: Filterable,
    {
        let mut dimensions = HashMap::new();
        for filter in filters {
            if let Some(target_filter) = filter.filter() {
                for dimension in TargetFilter::extract_dimensions(&target_filter) {
                    dimensions
                        .entry(dimension)
                        .or_insert_with(|| HashSet::new())
                        .insert(filter.id());
                }
            }
        }
        dimensions
    }
    fn add_all_dimensions<F>(&mut self, filters_to_insert: &Vec<F>)
    where
        F: Filterable,
    {
        let all_dimensions = &mut self.all_dimensions;

        for (dim, ids) in Self::build_all_dimensions(filters_to_insert) {
            all_dimensions
                .entry(dim)
                .or_insert_with(|| HashSet::new())
                .extend(ids);
        }
    }
    fn remove_all_dimensions<F>(&mut self, filters_to_delete: &Vec<F>)
    where
        F: Filterable,
    {
        let all_dimensions = &mut self.all_dimensions;

        for (dim, ids) in Self::build_all_dimensions(filters_to_delete).iter() {
            let prev_ids = all_dimensions
                .entry(dim.to_string())
                .or_insert_with(|| HashSet::new());

            for id in ids {
                prev_ids.remove(id);
            }
        }
        all_dimensions.retain(|_dv, ids| !ids.is_empty());
    }

    fn update_non_filter_ids<F>(&mut self, filters_to_insert: &Vec<F>, filters_to_delete: &Vec<F>)
    where
        F: Filterable,
    {
        let non_filter_ids = &mut self.non_filter_ids;
        for filter in filters_to_delete {
            non_filter_ids.remove(&filter.id());
        }
        for filter in filters_to_insert {
            match filter.filter() {
                None => {
                    non_filter_ids.insert(filter.id().clone());
                }
                Some(_) => {
                    non_filter_ids.remove(&filter.id());
                }
            }
        }
    }
    fn update_filters<F>(&mut self, filters_to_insert: &Vec<F>, filters_to_delete: &Vec<F>)
    where
        F: Filterable,
    {
        let filters = &mut self.filters;
        for filter in filters_to_delete {
            filters.remove(&filter.id());
        }
        for filter in filters_to_insert {
            match filter.filter() {
                None => {
                    filters.remove(&filter.id());
                }
                Some(target_filter) => {
                    filters.insert(filter.id(), target_filter);
                }
            }
        }
    }
    fn remove_filter_from_index<F>(&mut self, filter: &F)
    where
        F: Filterable,
    {
        let all_dimensions = &self.all_dimensions;
        let filters = &self.filters;
        let index = &mut self.index;

        if let Some(prev_target_filter) = filters.get(&filter.id()).or(filter.filter().as_ref()) {
            let index_key_with_internal_ids = TargetFilter::build_index_key_wth_internal_ids(
                &all_dimensions,
                prev_target_filter,
                &filter.id(),
            );

            for (dv, internal_id) in index_key_with_internal_ids {
                if let Some(prev_ids) = index.get_mut(&dv) {
                    prev_ids.remove(&internal_id);
                }
            }
        }
    }
    fn cleaup_index<F>(&mut self, filters_to_insert: &Vec<F>, filters_to_delete: &Vec<F>)
    where
        F: Filterable,
    {
        for filter in filters_to_insert {
            self.remove_filter_from_index(filter);
        }

        for filter in filters_to_delete {
            self.remove_filter_from_index(filter)
        }

        let index = &mut self.index;
        index.retain(|_dv, internal_ids| !internal_ids.is_empty());
    }
    fn update_index<F>(&mut self, filters_to_insert: &Vec<F>)
    where
        F: Filterable,
    {
        let all_dimensons = &mut self.all_dimensions;
        let index = &mut self.index;

        for filter in filters_to_insert {
            if let Some(target_filter) = filter.filter() {
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

    pub fn update<F>(&mut self, filters_to_insert: &Vec<F>, filters_to_delete: &Vec<F>) -> ()
    where
        F: Filterable,
    {
        // order of function calls is important.
        self.add_all_dimensions(filters_to_insert);
        self.update_non_filter_ids(filters_to_insert, filters_to_delete);

        self.cleaup_index(filters_to_insert, filters_to_delete);
        self.update_index(filters_to_insert);

        self.update_filters(filters_to_insert, filters_to_delete);
        self.remove_all_dimensions(filters_to_delete);
    }

    fn generate_dimension_candidates<'a>(
        user_info: &UserInfo,
        dimension: &String,
        index: &'a HashMap<DimValue, HashSet<String>>,
        is_not: bool,
    ) -> HashSet<&'a str> {
        let mut union: HashSet<&str> = HashSet::new();
        // empty key need to be lookup.
        let empty_dim_value = DimValue::new(dimension, "empty", is_not);
        if let Some(internal_ids) = index.get(&empty_dim_value) {
            for internal_id in internal_ids {
                union.insert(internal_id);
            }
        }
        if let Some(values) = user_info.get(dimension) {
            for value in values {
                let dim_value = DimValue::new(dimension, value, is_not);
                if let Some(internal_ids) = index.get(&dim_value) {
                    for internal_id in internal_ids {
                        union.insert(internal_id);
                    }
                }
            }
        }
        //println!("{:?} {:?} candidates {:?}", is_not, dimension, union);
        union
    }
    fn to_ids<'a>(internal_ids: &HashSet<&'a str>) -> HashSet<&'a str> {
        let mut ids = HashSet::new();
        for internal_id in internal_ids {
            if let Some((id, _seq)) = internal_id.rsplit_once("_") {
                ids.insert(id);
            }
        }
        ids
    }
    fn search_positive_internal_ids(&self, user_info: &UserInfo) -> Option<HashSet<&str>> {
        let all_dimensions = &self.all_dimensions;
        let true_index = &self.index;
        let mut positive_candidates: Option<HashSet<&str>> = None;

        for (dimension, _ids) in all_dimensions.iter() {
            let dim_candidates =
                Self::generate_dimension_candidates(user_info, dimension, true_index, false);
            let intersections = positive_candidates
                .map(|prev| {
                    let mut intersections = HashSet::new();
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
    fn search_negative_ids(&self, user_info: &UserInfo) -> HashSet<&str> {
        let all_dimensions = &self.all_dimensions;
        let index = &self.index;
        let mut union = HashSet::new();

        for (dimension, _ids) in all_dimensions.iter() {
            let dim_candidates =
                Self::generate_dimension_candidates(user_info, dimension, &index, true);
            union.extend(dim_candidates);
        }

        union
    }
    pub fn search(&self, user_info: &UserInfo) -> HashSet<&str> {
        let positive_candidates = 
            self.search_positive_internal_ids(user_info).unwrap_or(HashSet::default());
        let negative_candidates = self.search_negative_ids(user_info);
        let ids = &positive_candidates - &negative_candidates;
        let matched_ids = Self::to_ids(&ids);

        //println!("index search: {:?}", matched_ids);
        matched_ids
    }
}

#[cfg(test)]
#[path = "./index_test.rs"]
mod index_test;
