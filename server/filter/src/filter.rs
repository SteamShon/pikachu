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

enum TargetFilter {
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

fn build_target_keys(current_filter: &TargetFilter) -> Vec<Vec<String>> {
    let kv_delimiter = ".";
    let dim_value_delimiter = "_";
    let not_delimiter = "^";
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
            println!("Select: {:?}", dvs);
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
            println!("In: {:?}", dvs);
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
            println!("And: {:?}", dvs);
            dvs
        }
        TargetFilter::Or { fields } => {
            let childrens: Vec<String> = fields
                .iter()
                .flat_map(|field| build_target_keys(field))
                .flatten()
                .collect();
            let dvs = vec![childrens];
            println!("Or: {:?}", dvs);
            dvs
        }
        TargetFilter::Not { field } => {
            let child = build_target_keys(field);
            let dvs = child
                .iter()
                .map(|vs| {
                    vs.iter()
                        .map(|v| format!("not{not_delimiter}{value}", value = v))
                        .collect()
                })
                .collect();
            dvs
        }
    }
}

#[cfg(test)]
mod tests {
    use prisma_client_rust::query_core::In;

    use super::*;

    #[test]
    fn test_explode() {
        let input = vec![vec![1, 2, 3], vec![4, 5], vec![6]];
        let expected_output = vec![
            vec![1, 4, 6],
            vec![1, 5, 6],
            vec![2, 4, 6],
            vec![2, 5, 6],
            vec![3, 4, 6],
            vec![3, 5, 6],
        ];

        assert_eq!(explode(&input, &vec![][..]), expected_output);
    }
    #[test]
    fn test_extract_dim_values() {
        use TargetFilter::*;

        let input = And {
            fields: vec![
                Or {
                    fields: vec![
                        Select {
                            dimension: String::from("age"),
                            valid_value: String::from("10"),
                        },
                        And {
                            fields: vec![
                                In {
                                    dimension: String::from("age"),
                                    valid_values: HashSet::from([
                                        String::from("20"),
                                        String::from("30"),
                                    ]),
                                },
                                Select {
                                    dimension: String::from("gender"),
                                    valid_value: String::from("F"),
                                },
                            ],
                        },
                    ],
                },
                Not {
                    field: Box::new(In {
                        dimension: String::from("like"),
                        valid_values: HashSet::from([String::from("soccor")]),
                    }),
                },
            ],
        };
        let expected_output = vec![
            vec![1, 4, 6],
            vec![1, 5, 6],
            vec![2, 4, 6],
            vec![2, 5, 6],
            vec![3, 4, 6],
            vec![3, 5, 6],
        ];
        let output = build_target_keys(&input);

        for dvs in output {
            println!("{:?}", dvs)
        }
    }
}
