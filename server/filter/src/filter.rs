use common::types::{DimValue, UserInfo};
use serde::Serialize;
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::fmt::Debug;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct TargetKey {
    pub dim_values: Vec<DimValue>,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub enum TargetFilter {
    In {
        dimension: String,
        valid_values: HashSet<String>,
    },
    Select {
        dimension: String,
        valid_value: String,
    },
    And {
        fields: Vec<TargetFilter>,
    },
    Or {
        fields: Vec<TargetFilter>,
    },
    Not {
        field: Box<TargetFilter>,
    },
}
pub trait Filter {
    fn apply(&self, user_info: &UserInfo) -> bool;
}

impl TargetFilter {
    fn explode<T>(ls_of_ls: &[Vec<T>], prev: &[T]) -> Vec<Vec<T>>
    where
        T: Clone,
    {
        if ls_of_ls.is_empty() {
            vec![prev.to_vec()]
        } else {
            let head = &ls_of_ls[0];
            let rest = head
                .iter()
                .flat_map(|s| {
                    let next_prev: Vec<T> = prev.iter().chain([s]).cloned().collect();

                    Self::explode(&ls_of_ls[1..], &next_prev[..])
                })
                .collect::<Vec<Vec<T>>>();
            rest
        }
    }
    pub fn build_target_keys(current_filter: &TargetFilter) -> Vec<TargetKey> {
        let mut target_keys: Vec<TargetKey> = Self::build_target_keys_inner(current_filter)
            .into_iter()
            .flatten()
            .collect();

        target_keys.sort();
        target_keys
    }

    fn build_target_keys_inner(current_filter: &TargetFilter) -> Vec<Vec<TargetKey>> {
        match current_filter {
            TargetFilter::Select {
                dimension,
                valid_value,
            } => {
                let dvs = vec![vec![TargetKey {
                    dim_values: vec![DimValue {
                        dimension: dimension.to_string(),
                        value: valid_value.to_string(),
                        is_not: false,
                    }],
                }]];
                // println!("Select: {:?}", dvs);
                dvs
            }
            TargetFilter::In {
                dimension,
                valid_values,
            } => {
                let dvs = vec![valid_values
                    .iter()
                    .map(|v| TargetKey {
                        dim_values: vec![DimValue {
                            dimension: dimension.to_string(),
                            value: v.to_string(),
                            is_not: false,
                        }],
                    })
                    .collect()];
                // println!("In: {:?}", dvs);
                dvs
            }
            TargetFilter::And { fields } => {
                let childrens: Vec<Vec<TargetKey>> = fields
                    .iter()
                    .flat_map(|field| Self::build_target_keys_inner(field))
                    .collect();
                let dvs = Self::explode(&childrens, &vec![])
                    .iter()
                    .map(|ls| {
                        let mut dim_values: Vec<DimValue> = ls
                            .iter()
                            .flat_map(|target_key| target_key.dim_values.clone())
                            .collect();
                        dim_values.sort();
                        vec![TargetKey { dim_values }]
                    })
                    .collect();
                // println!("And: {:?}", dvs);
                dvs
            }
            TargetFilter::Or { fields } => {
                let mut childrens: Vec<TargetKey> = fields
                    .iter()
                    .flat_map(|field| Self::build_target_keys_inner(field))
                    .flatten()
                    .collect();
                childrens.sort();
                let dvs = vec![childrens];
                // println!("Or: {:?}", dvs);
                dvs
            }
            TargetFilter::Not { field } => {
                let child = Self::build_target_keys_inner(field);
                let dvs = child
                    .iter()
                    .map(|vs| {
                        vs.iter()
                            .map(|v| {
                                let mut dim_values: Vec<DimValue> = v
                                    .dim_values
                                    .iter()
                                    .map(|dv| DimValue {
                                        dimension: dv.dimension.to_string(),
                                        value: dv.value.to_string(),
                                        is_not: !dv.is_not,
                                    })
                                    .collect();
                                dim_values.sort();
                                TargetKey { dim_values }
                            })
                            .collect()
                    })
                    .collect();
                dvs
            }
        }
    }

    fn traverse<F>(filter: &TargetFilter, f: &mut F) -> ()
    where
        F: FnMut(&TargetFilter) -> (),
    {
        match filter {
            TargetFilter::In {
                dimension: _,
                valid_values: _,
            } => f(filter),
            TargetFilter::Select {
                dimension: _,
                valid_value: _,
            } => f(filter),
            TargetFilter::And { fields } => {
                f(filter);
                for field in fields {
                    Self::traverse(field, f);
                }
            }
            TargetFilter::Or { fields } => {
                f(filter);
                for field in fields {
                    Self::traverse(field, f);
                }
            }
            TargetFilter::Not { field } => {
                f(filter);
                Self::traverse(field, f);
            }
        }
    }

    pub fn extract_dimensions(filter: &TargetFilter) -> HashSet<String> {
        let mut dimensions = HashSet::<String>::new();

        let mut op = |current_filter: &TargetFilter| match current_filter {
            TargetFilter::In {
                dimension,
                valid_values: _,
            } => {
                dimensions.insert(dimension.clone());
            }
            TargetFilter::Select {
                dimension,
                valid_value: _,
            } => {
                dimensions.insert(dimension.clone());
            }
            _ => (),
        };

        Self::traverse(filter, &mut op);
        dimensions
    }
    pub fn to_internal_id(dv: &DimValue, id: &str, index: usize) -> String {
        if dv.is_not {
            String::from(id)
        } else {
            format!("{id}_{seq}", id = id, seq = index)
        }
    }
    pub fn build_index_key_wth_internal_ids(
        all_dimensions: &HashMap<String, HashSet<String>>,
        target_filter: &TargetFilter,
        id: &str,
    ) -> Vec<(DimValue, String)> {
        let mut dim_value_seqs = Vec::new();

        let target_keys = Self::build_target_keys(&target_filter);

        for (index, target_key) in target_keys.iter().enumerate() {
            let mut value_existing_dimensions = HashSet::new();

            // fill out index with dimension that has values.
            for dv in &target_key.dim_values {
                value_existing_dimensions.insert(dv.dimension.clone());

                dim_value_seqs.push((dv.clone(), Self::to_internal_id(dv, id, index)));
            }
            // fill out index for dimension that don't have values. empty.
            for (dimension, _ids) in all_dimensions {
                if !value_existing_dimensions.contains(dimension) {
                    let dv = DimValue::new(&dimension, "empty", false);

                    dim_value_seqs.push((dv.clone(), Self::to_internal_id(&dv, id, index)));
                }
            }
        }
        dim_value_seqs
    }
}

#[cfg(test)]
#[path = "./filter_test.rs"]
mod filter_test;
