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
                let fields: Vec<_> = fields.iter().map(|f| Self::to_json(f)).collect();
                json!({
                    "type": "and",
                    "fields": fields
                })
            }
            TargetFilter::Or { fields } => {
                let fields: Vec<_> = fields.iter().map(|f| Self::to_json(f)).collect();
                json!({
                    "type": "or",
                    "fields": fields
                })
            }
            TargetFilter::Not { field } => {
                json!({
                    "type": "not",
                    "field": Self::to_json(field)
                })
            }
        }
    }
    pub fn to_jsonlogic(filter: &TargetFilter) -> serde_json::Value {
        match filter {
            TargetFilter::In {
                dimension,
                valid_values,
            } => json!({
                "in": [{"var": dimension}, valid_values]
            }),
            TargetFilter::Select {
                dimension,
                valid_value,
            } => {
                json!({
                    "==": [{"var": dimension}, valid_value]
                })
            }
            TargetFilter::And { fields } => {
                let fields: Vec<_> = fields.iter().map(|f| Self::to_jsonlogic(f)).collect();
                json!({ "and": fields })
            }
            TargetFilter::Or { fields } => {
                let fields: Vec<_> = fields.iter().map(|f| Self::to_jsonlogic(f)).collect();
                json!({ "or": fields })
            }
            TargetFilter::Not { field } => {
                json!({ "!": Self::to_jsonlogic(field) })
            }
        }
    }
    pub fn from_jsonlogic(value: &Value) -> Option<Self> {
        if !&value["!"].is_null() {
            let field = Box::new(Self::from_jsonlogic(&value["!"])?);
            return Some(TargetFilter::Not { field });
        }
        if let Value::Array(childrens) = &value["and"] {
            let fields: Vec<TargetFilter> = childrens
                .iter()
                .flat_map(|child| Self::from_jsonlogic(child))
                .collect();
            return Some(TargetFilter::And { fields });
        }
        if let Value::Array(childrens) = &value["or"] {
            let fields: Vec<TargetFilter> = childrens
                .iter()
                .flat_map(|child| Self::from_jsonlogic(child))
                .collect();
            return Some(TargetFilter::Or { fields });
        }
        if let Value::Array(op_values) = &value["in"] {
            let dimension = String::from(op_values[0]["var"].as_str()?);
            let valid_values: HashSet<String> = op_values[1]
                .as_array()?
                .iter()
                .flat_map(|v| v.as_str())
                .map(|v| String::from(v))
                .collect();
            return Some(TargetFilter::In {
                dimension,
                valid_values,
            });
        }

        None
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
        all_dimensions: &HashSet<String>,
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
            for dimension in all_dimensions - &value_existing_dimensions {
                let dv = DimValue::new(&dimension, "empty", false);

                dim_value_seqs.push((dv.clone(), Self::to_internal_id(&dv, id, index)));
            }
        }
        dim_value_seqs
    }
}

#[cfg(test)]
#[path = "./filter_test.rs"]
mod filter_test;
