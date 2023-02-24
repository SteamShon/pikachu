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

pub type UserInfo = HashMap<String, HashSet<String>>;

//enum TargetFilter {
//    In(InFilter),
//    And(Vec<TargetFilter>),
//    Or(Vec<TargetFilter>),
//}

pub trait Filter: DynClone + Debug {
    fn apply(&self, user_info: &UserInfo) -> FilterResult;
    fn as_any(&self) -> &dyn Any;
}

clone_trait_object!(Filter);

#[derive(Clone, Debug)]
struct NotFilter {
    field: Box<dyn Filter>,
}
impl Filter for NotFilter {
    fn apply(&self, user_info: &UserInfo) -> FilterResult {
        let FilterResult { filtered } = self.field.apply(&user_info);

        FilterResult {
            filtered: !filtered,
        }
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}
#[derive(Clone, Debug)]
struct OrFilter {
    fields: Vec<Box<dyn Filter>>,
}
impl Filter for OrFilter {
    fn apply(&self, user_info: &UserInfo) -> FilterResult {
        let mut all_matched = true;
        for filter in &self.fields {
            let FilterResult { filtered } = filter.apply(&user_info);
            if filtered {
                all_matched = true;
            }
        }
        FilterResult {
            filtered: all_matched,
        }
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
#[derive(Clone, Debug)]
struct AndFilter {
    fields: Vec<Box<dyn Filter>>,
}
impl Filter for AndFilter {
    fn apply(&self, user_info: &UserInfo) -> FilterResult {
        let mut all_matched = true;
        let mut iter = self.fields.iter();
        let mut current = iter.next();
        while current.is_some() && all_matched {
            let FilterResult { filtered } = (*current.unwrap()).apply(&user_info);

            all_matched = filtered;
            current = iter.next();
        }
        FilterResult {
            filtered: all_matched,
        }
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}
#[derive(Clone, Debug, Serialize, Deserialize)]
struct SelectorFilter {
    dimension: String,
    valid_value: String,
}
impl Filter for SelectorFilter {
    fn apply(&self, user_info: &UserInfo) -> FilterResult {
        match user_info.get(&self.dimension) {
            None => FilterResult { filtered: false },
            Some(values) => match values.iter().find(|v| self.valid_value == **v) {
                None => FilterResult { filtered: false },
                Some(_) => FilterResult { filtered: true },
            },
        }
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct InFilter {
    dimension: String,
    valid_values: HashSet<String>,
}
impl Filter for InFilter {
    fn apply(&self, user_info: &UserInfo) -> FilterResult {
        match user_info.get(&self.dimension) {
            None => FilterResult { filtered: false },
            Some(values) => {
                let intersection: HashSet<_> = self.valid_values.intersection(&values).collect();
                FilterResult {
                    filtered: !intersection.is_empty(),
                }
            }
        }
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}

fn flat_or(f: OrFilter) -> OrFilter {
    let (or_filters, others): (Vec<_>, Vec<_>) = f
        .fields
        .into_iter()
        .partition(|f| f.as_any().downcast_ref::<OrFilter>().is_some());

    let or_ls = or_filters
        .into_iter()
        .map(|f| flat_or((*f.as_any().downcast_ref::<OrFilter>().unwrap()).clone()))
        .flat_map(|f| f.fields)
        .collect::<Vec<_>>();

    OrFilter {
        fields: others.into_iter().chain(or_ls).collect(),
    }
}

fn flat_and(f: AndFilter) -> AndFilter {
    let (and_filters, others): (Vec<_>, Vec<_>) = f
        .fields
        .into_iter()
        .partition(|f| f.as_any().downcast_ref::<AndFilter>().is_some());

    let and_ls = and_filters
        .into_iter()
        .map(|f| flat_and((*f.as_any().downcast_ref::<AndFilter>().unwrap()).clone()))
        .flat_map(|f| f.fields)
        .collect::<Vec<_>>();

    AndFilter {
        fields: others.into_iter().chain(and_ls).collect(),
    }
}

fn flat_not(f: Box<dyn Filter>) -> Box<dyn Filter> {
    match f.as_any().downcast_ref::<NotFilter>() {
        Some(not_filter)
            if not_filter
                .field
                .as_any()
                .downcast_ref::<NotFilter>()
                .is_some() =>
        {
            flat_not(not_filter.field.clone())
        }
        _ => f,
    }
}
fn explode_inner(fs: InFilter) -> OrFilter {
    let fields = fs
        .valid_values
        .iter()
        .map(|v| {
            let filter: Box<dyn Filter> = Box::new(SelectorFilter {
                dimension: fs.dimension.clone(),
                valid_value: v.clone(),
            });

            filter
        })
        .collect::<Vec<_>>();

    OrFilter { fields }
}

fn explode_in(f: Box<dyn Filter>) -> Box<dyn Filter> {
    let and_filter = f.as_any().downcast_ref::<AndFilter>();
    let or_filter = f.as_any().downcast_ref::<OrFilter>();
    let not_filter = f.as_any().downcast_ref::<NotFilter>();
    let in_filter = f.as_any().downcast_ref::<InFilter>();
    if let Some(and) = and_filter {
        return Box::new(AndFilter {
            fields: and
                .fields
                .iter()
                .map(|child| explode_in((*child).clone()))
                .collect(),
        });
    }
    if let Some(or) = or_filter {
        return Box::new(OrFilter {
            fields: or
                .fields
                .iter()
                .map(|child| explode_in((*child).clone()))
                .collect(),
        });
    }
    if let Some(not) = not_filter {
        return Box::new(NotFilter {
            field: explode_in(not.field.clone()),
        });
    }
    if let Some(in_f) = in_filter {
        return Box::new(explode_inner((*in_f).clone()));
    }

    f
}

fn flat_container(f: Box<dyn Filter>) -> Box<dyn Filter> {
    let and_filter = f.as_any().downcast_ref::<AndFilter>();
    let or_filter = f.as_any().downcast_ref::<OrFilter>();
    let not_filter = f.as_any().downcast_ref::<NotFilter>();

    if let Some(and) = and_filter {
        return Box::new(flat_and(AndFilter {
            fields: and
                .fields
                .iter()
                .map(|f| flat_container((*f).clone()))
                .collect(),
        }));
    }
    if let Some(or) = or_filter {
        return Box::new(flat_or(OrFilter {
            fields: or
                .fields
                .iter()
                .map(|f| flat_container((*f).clone()))
                .collect(),
        }));
    }
    if let Some(not) = not_filter {
        return flat_not(Box::new(NotFilter {
            field: flat_not(not.field.clone()),
        }));
    }

    f
}
fn unwrap_one_field(f: Box<dyn Filter>) -> Box<dyn Filter> {
    let and_filter = f.as_any().downcast_ref::<AndFilter>();
    let or_filter = f.as_any().downcast_ref::<OrFilter>();
    if let Some(and) = and_filter {
        if and.fields.len() == 1 {
            return and.fields.iter().next().unwrap().clone();
        } else {
            return Box::new(AndFilter {
                fields: and
                    .fields
                    .iter()
                    .map(|f| unwrap_one_field((*f).clone()))
                    .collect(),
            });
        }
    }
    if let Some(or) = or_filter {
        if or.fields.len() == 1 {
            return or.fields.iter().next().unwrap().clone();
        } else {
            return Box::new(AndFilter {
                fields: or
                    .fields
                    .iter()
                    .map(|f| unwrap_one_field((*f).clone()))
                    .collect(),
            });
        }
    }

    f
}

fn flatten(f: Box<dyn Filter>) -> Box<dyn Filter> {
    // .and_then(flat_and_to_or_try);
    flat_and_to_or_try(unwrap_one_field(flat_container(explode_in(f))))
}

fn flat_and_to_or_try(f: Box<dyn Filter>) -> Box<dyn Filter> {
    let and_filter = f.as_any().downcast_ref::<AndFilter>();
    let or_filter = f.as_any().downcast_ref::<OrFilter>();
    let not_filter = f.as_any().downcast_ref::<NotFilter>();

    if let Some(and) = and_filter {
        let fields = and.fields.iter().map(|f| flat_and_to_or_try((*f).clone()));

        let (or_filters, others): (Vec<_>, Vec<_>) =
            fields.partition(|f| f.as_any().downcast_ref::<OrFilter>().is_some());

        if or_filters.is_empty() {
            return Box::new(AndFilter { fields: others });
        } else {
            let and_ls = or_filters
                .iter()
                .flat_map(|or| {
                    or.as_any()
                        .downcast_ref::<OrFilter>()
                        .unwrap()
                        .fields
                        .iter()
                        .map(|f| {
                            flatten(Box::new(AndFilter {
                                fields: others.iter().chain([f]).cloned().collect(),
                            }))
                        })
                })
                .collect();

            return flatten(Box::new(OrFilter { fields: and_ls }));
        }
    }
    if let Some(or) = or_filter {
        return Box::new(OrFilter {
            fields: or
                .fields
                .iter()
                .map(|f| flat_and_to_or_try((*f).clone()))
                .collect(),
        });
    }
    if let Some(not) = not_filter {
        return Box::new(NotFilter {
            field: flat_and_to_or_try(not.field.clone()),
        });
    }

    f
}

#[cfg(test)]
mod filter_tests {

    use super::*;
    #[test]
    fn test_flat_or() {
        /*
        input:
        Or(   //
            Or( //
                In("age", "10", "20"),
                Or(   //
                    Or( //
                        In("gender", "M"),
                        In("gender", "F")
                    ),
                    Or( //
                        In("interests", "I1")
                    )
                )
            )
        )
        expected:
        Or( //
            In("age", "10", "20"),
            In("gender", "M"),
            In("gender", "F"),
            In("interests", "I1")
        )
         */
        let filter = OrFilter {
            fields: vec![Box::new(OrFilter {
                fields: vec![
                    Box::new(InFilter {
                        dimension: String::from("age"),
                        valid_values: HashSet::from([String::from("10"), String::from("20")]),
                    }),
                    Box::new(OrFilter {
                        fields: vec![
                            Box::new(OrFilter {
                                fields: vec![
                                    Box::new(InFilter {
                                        dimension: String::from("gender"),
                                        valid_values: HashSet::from([String::from("M")]),
                                    }),
                                    Box::new(InFilter {
                                        dimension: String::from("gender"),
                                        valid_values: HashSet::from([String::from("F")]),
                                    }),
                                ],
                            }),
                            Box::new(OrFilter {
                                fields: vec![Box::new(InFilter {
                                    dimension: String::from("interests"),
                                    valid_values: HashSet::from([String::from("I1")]),
                                })],
                            }),
                        ],
                    }),
                ],
            })],
        };

        let flat_filter = flat_or(filter);
        println!("{:?}", flat_filter);
    }

    #[test]
    fn test_flat_and() {
        /*
        input:
        And(   //
          And( //
            In("age", "10", "20"),
            And( //
              In("gender", "F"),
              And( //
                In("interests", "I1")
              )
            )
          )
        )
        expected:
        And( //
            In("age", "10", "20"),
            In("gender", "F"),
            In("interests", "I1")
        )
           */
        let filter = AndFilter {
            fields: vec![Box::new(AndFilter {
                fields: vec![
                    Box::new(InFilter {
                        dimension: String::from("age"),
                        valid_values: HashSet::from([String::from("10"), String::from("20")]),
                    }),
                    Box::new(AndFilter {
                        fields: vec![
                            Box::new(InFilter {
                                dimension: String::from("gender"),
                                valid_values: HashSet::from([String::from("F")]),
                            }),
                            Box::new(AndFilter {
                                fields: vec![Box::new(InFilter {
                                    dimension: String::from("interests"),
                                    valid_values: HashSet::from([String::from("I1")]),
                                })],
                            }),
                        ],
                    }),
                ],
            })],
        };

        let flat_filter = flat_and(filter);
        println!("{:?}", flat_filter);
    }
    #[test]
    fn test_flat_not() {
        /*
        input:
        Not(
            Not(
                Not(
                    In("age", "10", "20")
                )
            )
        )
        expected:
        Not(
            In("age", "10", "20")
        )
           */
        let filter = Box::new(NotFilter {
            field: Box::new(NotFilter {
                field: Box::new(NotFilter {
                    field: {
                        Box::new(InFilter {
                            dimension: String::from("interests"),
                            valid_values: HashSet::from([String::from("I1")]),
                        })
                    },
                }),
            }),
        });

        let flat_filter = flat_not(filter);
        println!("{:?}", flat_filter);
    }
    #[test]
    fn test_in_filter() {
        let filter_raw = r#"
        {
            "type": "or",
            "fields": [
                {
                    "type": "in", "dimension": "age", "values": ["10", "20"]
                }, 
                {
                    "type": "and", 
                    "fields": [
                        { 
                            "type": "in", 
                            "dimension": "gender", 
                            "values": ["F"]
                        },
                        {
                            "type": "in", 
                            "dimension": "interests", 
                            "values": ["I1", "I3"]
                        }
                    ]
                },
                {
                    "type": "not", 
                    "field": {
                        "type": "in",
                        "dimension": "interests",
                        "values": ["I3"]
                    }
                }, 
            ]
        }
        "#;
        let user_info: HashMap<String, HashSet<String>> = serde_json::from_str(
            r#"
        {
            "age": ["10"],
            "gender": ["F"],
            "interest": ["I_1", "I_2"]
        }
            "#,
        )
        .unwrap();

        let in_filter = InFilter {
            dimension: String::from("age"),
            valid_values: HashSet::from([String::from("10")]),
        };
        let result = in_filter.apply(&user_info);

        println!("{:?}", result.filtered)
    }
}
