use dyn_clone::{clone_trait_object, DynClone};
use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use std::{
    any::Any,
    collections::{HashMap, HashSet},
};
pub struct FilterResult {
    filtered: bool,
}

#[derive(Clone, Debug)]
pub struct DimValue {
    dimension: String,
    value: String,
}
pub type UserInfo = HashMap<String, HashSet<String>>;

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
    fn apply(&self, user_info: &UserInfo) -> FilterResult;
}

fn explode<T: Clone>(ls_of_ls: &[Vec<T>], prev: &[T]) -> Vec<Vec<T>> {
    if ls_of_ls.is_empty() {
        vec![prev.to_vec()]
    } else {
        let head = &ls_of_ls[0];
        let rest = head
            .iter()
            .flat_map(|s| {
                let next_prev: Vec<T> = prev.iter().chain([s]).cloned().collect();

                explode(&ls_of_ls[1..], &next_prev[..])
            })
            .collect::<Vec<Vec<T>>>();
        rest
    }
}

pub fn build_target_keys(current_filter: &TargetFilter) -> Vec<Vec<String>> {
    // let kv_delimiter = ".";
    // let dim_value_delimiter = "_";
    // let not_prefix = "!";
    let kv_delimiter = ".";
    let dim_value_delimiter = "_AND_";
    let not_prefix = "NOT_";
    match current_filter {
        TargetFilter::Select {
            dimension,
            valid_value,
        } => {
            let dvs = vec![vec![format!(
                "{dimension}{kv_delimiter}{value}",
                dimension = dimension,
                value = valid_value,
            )]];
            // println!("Select: {:?}", dvs);
            dvs
        }
        TargetFilter::In {
            dimension,
            valid_values,
        } => {
            let dvs = vec![valid_values
                .iter()
                .map(|v| {
                    format!(
                        "{dimension}{kv_delimiter}{value}",
                        dimension = dimension,
                        value = v
                    )
                })
                .collect()];
            // println!("In: {:?}", dvs);
            dvs
        }
        TargetFilter::And { fields } => {
            let childrens: Vec<Vec<String>> = fields
                .iter()
                .flat_map(|field| build_target_keys(field))
                .collect();
            let dvs = explode(&childrens, &vec![])
                .iter()
                .map(|ls| vec![ls.join(dim_value_delimiter)])
                .collect();
            // println!("And: {:?}", dvs);
            dvs
        }
        TargetFilter::Or { fields } => {
            let childrens: Vec<String> = fields
                .iter()
                .flat_map(|field| build_target_keys(field))
                .flatten()
                .collect();
            let dvs = vec![childrens];
            // println!("Or: {:?}", dvs);
            dvs
        }
        TargetFilter::Not { field } => {
            let child = build_target_keys(field);
            let dvs = child
                .iter()
                .map(|vs| {
                    vs.iter()
                        .map(|v| format!("{not_prefix}{value}", value = v))
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
                traverse(field, f);
            }
        }
        TargetFilter::Or { fields } => {
            f(filter);
            for field in fields {
                traverse(field, f);
            }
        }
        TargetFilter::Not { field } => {
            f(filter);
            traverse(field, f);
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

    traverse(filter, &mut op);
    dimensions
}

#[cfg(test)]
#[path = "./filter_test.rs"]
mod filter_test;
