use super::*;
use lazy_static::lazy_static;
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
    let all_dimensions = extract_dimensions(&FILTER_1);
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

    assert_eq!(explode(&input, &vec![][..]), expected_output);
}
fn check_target_keys(output: Vec<Vec<String>>, expected_output: Vec<Vec<String>>) -> bool {
    let output_sorted: Vec<Vec<String>> = output
        .into_iter()
        .map(|mut ls| {
            ls.sort();
            ls
        })
        .collect();
    let expected_output_sorted: Vec<Vec<String>> = expected_output
        .into_iter()
        .map(|mut ls| {
            ls.sort();
            ls
        })
        .collect();

    output_sorted == expected_output_sorted
}

#[test]
fn test_build_target_keys_filter_1() {
    let expected_output = vec![vec![
        String::from("age.10"),
        String::from("age.20"),
        String::from("gender.F"),
        String::from("age.10_AND_NOT_interests.L2,L3"),
        String::from("age.20_AND_NOT_interests.L2,L3"),
    ]];
    let output = build_target_keys(&FILTER_1);
    println!("{:?}", output);

    assert_eq!(check_target_keys(output, expected_output), true);
}
#[test]
fn test_build_target_keys_filter_2() {
    let output = build_target_keys(&FILTER_2);
    let expected_output = vec![vec![
        String::from("age.10"),
        String::from("age.20"),
        String::from("gender.F_AND_interests.L1"),
        String::from("gender.F_AND_age.10_AND_NOT_interests.L2,L3"),
        String::from("gender.F_AND_age.20_AND_NOT_interests.L2,L3"),
    ]];
    println!("{:?}", output);
    assert_eq!(check_target_keys(output, expected_output), true);
}
