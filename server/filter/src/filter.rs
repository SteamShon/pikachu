use fasthash::city;
use serde::Serialize;
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::fmt::Debug;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize)]
pub struct DimValue {
    pub dimension: String,
    pub value: String,
    pub is_not: bool,
}
impl DimValue {
    pub fn new(dim: &str, value: &str, is_not: bool) -> Self {
        DimValue {
            dimension: String::from(dim),
            value: String::from(value),
            is_not,
        }
    }
    pub fn to_hash(&self) -> u64 {
        city::hash64(format!(
            "{is_not}.{dimension}.{value}",
            is_not = self.is_not,
            dimension = self.dimension,
            value = self.value
        ))
    }
}
pub type UserInfo = HashMap<String, HashSet<String>>;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct TargetKey {
    pub dim_values: Vec<DimValue>,
}
#[derive(Debug, PartialEq, Eq)]
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

                explode(&ls_of_ls[1..], &next_prev[..])
            })
            .collect::<Vec<Vec<T>>>();
        rest
    }
}
pub fn build_target_keys(current_filter: &TargetFilter) -> Vec<TargetKey> {
    let mut target_keys: Vec<TargetKey> = build_target_keys_inner(current_filter)
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
                .flat_map(|field| build_target_keys_inner(field))
                .collect();
            let dvs = explode(&childrens, &vec![])
                .iter()
                .map(|ls| {
                    let dim_values: Vec<DimValue> = ls
                        .iter()
                        .flat_map(|target_key| target_key.dim_values.clone())
                        .collect();

                    vec![TargetKey { dim_values }]
                })
                .collect();
            // println!("And: {:?}", dvs);
            dvs
        }
        TargetFilter::Or { fields } => {
            let childrens: Vec<TargetKey> = fields
                .iter()
                .flat_map(|field| build_target_keys_inner(field))
                .flatten()
                .collect();
            let dvs = vec![childrens];
            // println!("Or: {:?}", dvs);
            dvs
        }
        TargetFilter::Not { field } => {
            let child = build_target_keys_inner(field);
            let dvs = child
                .iter()
                .map(|vs| {
                    vs.iter()
                        .map(|v| {
                            let dim_values: Vec<DimValue> = v
                                .dim_values
                                .iter()
                                .map(|dv| DimValue {
                                    dimension: dv.dimension.to_string(),
                                    value: dv.value.to_string(),
                                    is_not: !dv.is_not,
                                })
                                .collect();

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

impl TargetFilter {
    pub fn to_json(filter: &TargetFilter) -> serde_json::Value {
        match filter {
            TargetFilter::In {
                dimension,
                valid_values,
            } => json!({
                "type": "in",
                "dimension": dimension,
                "values": valid_values,
            }),
            TargetFilter::Select {
                dimension,
                valid_value,
            } => {
                json!({
                    "type": "select",
                    "dimension": dimension,
                    "value": valid_value,
                })
            }
            TargetFilter::And { fields } => {
                let fields: Vec<_> = fields.iter().map(|f| TargetFilter::to_json(f)).collect();
                json!({
                    "type": "and",
                    "fields": fields
                })
            }
            TargetFilter::Or { fields } => {
                let fields: Vec<_> = fields.iter().map(|f| TargetFilter::to_json(f)).collect();
                json!({
                    "type": "or",
                    "fields": fields
                })
            }
            TargetFilter::Not { field } => {
                json!({
                    "type": "not",
                    "field": TargetFilter::to_json(field)
                })
            }
        }
    }
    pub fn from(value: &Value) -> Option<Self> {
        match value["type"].as_str() {
            None => None,
            Some(t) => match t {
                "in" => {
                    let dimension = value["dimension"].as_str()?.to_string();
                    let mut valid_values = HashSet::new();
                    for value in value["values"].as_array()? {
                        for v in value.as_str() {
                            valid_values.insert(v.to_string());
                        }
                    }

                    Some(TargetFilter::In {
                        dimension,
                        valid_values,
                    })
                }
                "select" => {
                    let dimension = value["dimension"].as_str()?.to_string();
                    let valid_value = value["value"].as_str()?.to_string();
                    Some(TargetFilter::Select {
                        dimension,
                        valid_value,
                    })
                }
                "and" => {
                    let fields: Vec<TargetFilter> = value["fields"]
                        .as_array()?
                        .iter()
                        .flat_map(|field| TargetFilter::from(field))
                        .collect();
                    Some(TargetFilter::And { fields })
                }
                "or" => {
                    let fields: Vec<TargetFilter> = value["fields"]
                        .as_array()?
                        .iter()
                        .flat_map(|field| TargetFilter::from(field))
                        .collect();
                    Some(TargetFilter::Or { fields })
                }
                "not" => Some(TargetFilter::Not {
                    field: Box::new(TargetFilter::from(&value["field"])?),
                }),
                _ => None,
            },
        }
    }
}

#[cfg(test)]
#[path = "./filter_test.rs"]
mod filter_test;
