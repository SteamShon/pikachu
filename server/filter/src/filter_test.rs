use super::*;
use crate::serde;
use lazy_static::lazy_static;
use serde_json::Value;
use std::collections::HashSet;
use TargetFilter::*;

lazy_static! {
    static ref FILTER_1: TargetFilter = {
        Or {
            fields: vec![
                In {
                    dimension: String::from("age"),
                    valid_values: HashSet::from([String::from("10"), String::from("20")]),
                },
                Or {
                    fields: vec![
                        In {
                            dimension: String::from("gender"),
                            valid_values: HashSet::from([String::from("F")]),
                        },
                        And {
                            fields: vec![
                                In {
                                    dimension: String::from("age"),
                                    valid_values: HashSet::from([
                                        String::from("10"),
                                        String::from("20"),
                                    ]),
                                },
                                Not {
                                    field: Box::new(In {
                                        dimension: String::from("interests"),
                                        valid_values: HashSet::from([String::from("L2,L3")]),
                                    }),
                                },
                            ],
                        },
                    ],
                },
            ],
        }
    };
    static ref FILTER_2: TargetFilter = {
        Or {
            fields: vec![
                In {
                    dimension: String::from("age"),
                    valid_values: HashSet::from([String::from("10"), String::from("20")]),
                },
                And {
                    fields: vec![
                        In {
                            dimension: String::from("gender"),
                            valid_values: HashSet::from([String::from("F")]),
                        },
                        Or {
                            fields: vec![
                                In {
                                    dimension: String::from("interests"),
                                    valid_values: HashSet::from([String::from("L1")]),
                                },
                                And {
                                    fields: vec![
                                        In {
                                            dimension: String::from("age"),
                                            valid_values: HashSet::from([
                                                String::from("10"),
                                                String::from("20"),
                                            ]),
                                        },
                                        Not {
                                            field: Box::new(In {
                                                dimension: String::from("interests"),
                                                valid_values: HashSet::from([String::from(
                                                    "L2,L3",
                                                )]),
                                            }),
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        }
    };
}
#[test]
fn test_extract_dimensions_for_single_filter() {
    let all_dimensions = TargetFilter::extract_dimensions(&FILTER_1);
    let expected_output = HashSet::from([
        String::from("age"),
        String::from("gender"),
        String::from("interests"),
    ]);
    assert_eq!(all_dimensions, expected_output);
}

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

    assert_eq!(TargetFilter::explode(&input, &vec![][..]), expected_output);
}

#[test]
fn test_build_target_keys_filter_1() {
    /*
    let expected_output = vec![vec![
        String::from("age.10"),
        String::from("age.20"),
        String::from("gender.F"),
        String::from("age.10_AND_NOT_interests.L2,L3"),
        String::from("age.20_AND_NOT_interests.L2,L3"),
    ]];
    */
    let expected_output = vec![
        TargetKey {
            dim_values: vec![DimValue {
                dimension: String::from("age"),
                value: String::from("10"),
                is_not: false,
            }],
        },
        TargetKey {
            dim_values: vec![
                DimValue {
                    dimension: String::from("age"),
                    value: String::from("10"),
                    is_not: false,
                },
                DimValue {
                    dimension: String::from("interests"),
                    value: String::from("L2,L3"),
                    is_not: true,
                },
            ],
        },
        TargetKey {
            dim_values: vec![DimValue {
                dimension: String::from("age"),
                value: String::from("20"),
                is_not: false,
            }],
        },
        TargetKey {
            dim_values: vec![
                DimValue {
                    dimension: String::from("age"),
                    value: String::from("20"),
                    is_not: false,
                },
                DimValue {
                    dimension: String::from("interests"),
                    value: String::from("L2,L3"),
                    is_not: true,
                },
            ],
        },
        TargetKey {
            dim_values: vec![DimValue {
                dimension: String::from("gender"),
                value: String::from("F"),
                is_not: false,
            }],
        },
    ];

    let output = TargetFilter::build_target_keys(&FILTER_1);

    println!("{:?}", output);
    for (a, b) in output.iter().zip(expected_output.iter()) {
        assert_eq!(*a, *b)
    }
}
#[test]
fn test_build_target_keys_filter_2() {
    let output = TargetFilter::build_target_keys(&FILTER_2);
    let expected_output = vec![
        TargetKey {
            dim_values: vec![DimValue {
                dimension: String::from("age"),
                value: String::from("10"),
                is_not: false,
            }],
        },
        TargetKey {
            dim_values: vec![
                DimValue {
                    dimension: String::from("age"),
                    value: String::from("10"),
                    is_not: false,
                },
                DimValue {
                    dimension: String::from("gender"),
                    value: String::from("F"),
                    is_not: false,
                },
                DimValue {
                    dimension: String::from("interests"),
                    value: String::from("L2,L3"),
                    is_not: true,
                },
            ],
        },
        TargetKey {
            dim_values: vec![DimValue {
                dimension: String::from("age"),
                value: String::from("20"),
                is_not: false,
            }],
        },
        TargetKey {
            dim_values: vec![
                DimValue {
                    dimension: String::from("age"),
                    value: String::from("20"),
                    is_not: false,
                },
                DimValue {
                    dimension: String::from("gender"),
                    value: String::from("F"),
                    is_not: false,
                },
                DimValue {
                    dimension: String::from("interests"),
                    value: String::from("L2,L3"),
                    is_not: true,
                },
            ],
        },
        TargetKey {
            dim_values: vec![
                DimValue {
                    dimension: String::from("gender"),
                    value: String::from("F"),
                    is_not: false,
                },
                DimValue {
                    dimension: String::from("interests"),
                    value: String::from("L1"),
                    is_not: false,
                },
            ],
        },
    ];

    println!("{:?}", output);
    for (a, b) in output.iter().zip(expected_output.iter()) {
        assert_eq!(*a, *b)
    }
}

#[test]
fn test_target_filter_from_raw_string() {
    let raw_str = r#"{
        "type": "or",
        "fields": [
            {
                "type": "in", 
                "dimension": "age", 
                "values": ["10", "20"]
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
                        "type": "or", 
                        "fields": [
                            {
                                "type": "in", 
                                "dimension": "interests", 
                                "values": ["L1"]
                            },
                            {
                                "type": "and",
                                "fields": [
                                    {
                                        "type": "in", 
                                        "dimension": "age", 
                                        "values": ["10", "20"]
                                    },
                                    {
                                        "type": "not", 
                                        "field": {
                                            "type": "in", 
                                            "dimension": "interests", 
                                            "values": ["L2,L3"]
                                        }
                                    }
                                ]
                            }
                        ]
                    }                    
                ]
            }
        ]
    }"#;
    let value: Value = serde_json::from_str(raw_str).unwrap();
    let deserialized_filter = serde::from_json(&value).unwrap();
    let serialized_filter = serde::to_json(&deserialized_filter);
    let deserialized_filter_after = serde::from_json(&serialized_filter).unwrap();

    println!("{:?}", deserialized_filter);
    println!("{:?}", serialized_filter);
    println!("{:?}", value);
    assert_eq!(deserialized_filter, deserialized_filter_after);
}
#[test]
fn test_jsonlogic_serde() {
    let raw_str = r#"
    {
        "or": [
            {"in": [{"var": "age"}, ["10", "20"]]},
            {"and": [
                {"in": [{"var": "gender"}, ["F"]]},
                {"or": [
                    {"in": [{"var": "interests"}, ["L1"]]},
                    {"and": [
                        {"in": [{"var": "age"}, ["10", "20"]]},
                        {"!": {"in": [{"var": "interests"}, ["L2,L3"]]}}
                    ]}
                ]}
            ]}
        ]
    }
    "#;
    let value: Value = serde_json::from_str(raw_str).unwrap();
    let deserialized_filter = serde::from_jsonlogic(&value).unwrap();
    let serialized_filter = serde::to_jsonlogic(&deserialized_filter);
    let deserialized_filter_after = serde::from_jsonlogic(&serialized_filter).unwrap();

    println!("{:?}", deserialized_filter);
    println!("{:?}", serialized_filter);
    println!("{:?}", value);
    assert_eq!(deserialized_filter, deserialized_filter_after);
}
