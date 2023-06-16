use super::*;

use serde_json::Value;
use std::collections::HashSet;
use crate::serde;

struct TestFilter {
    id: String,
    filter: String,
}
impl TestFilter {
    fn from(other: &TestFilter) -> Self {
        Self {
            id: String::from(&other.id),
            filter: String::from(&other.filter),
        }
    }
}
impl Filterable for TestFilter {
    fn id(&self) -> String {
        String::from(&self.id)
    }

    fn filter(&self) -> Option<TargetFilter> {
        let value: Value = serde_json::from_str(&self.filter).ok()?;
        serde::from_json(&value)
    }
}
const FILTER_1_STR: &str = r#"
    {
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

fn test_filter_1(id: &str) -> TestFilter {
    TestFilter {
        id: String::from(id),
        filter: String::from(FILTER_1_STR),
    }
}
fn test_filter_1_expected_target_keys() -> Vec<TargetKey> {
    vec![
        TargetKey {
            dim_values: vec![DimValue::new("age", "10", false)],
        },
        TargetKey {
            dim_values: vec![
                DimValue::new("age", "10", false),
                DimValue::new("gender", "F", false),
                DimValue::new("interests", "L2,L3", true),
            ],
        },
        TargetKey {
            dim_values: vec![DimValue::new("age", "20", false)],
        },
        TargetKey {
            dim_values: vec![
                DimValue::new("age", "20", false),
                DimValue::new("gender", "F", false),
                DimValue::new("interests", "L2,L3", true),
            ],
        },
        TargetKey {
            dim_values: vec![
                DimValue::new("gender", "F", false),
                DimValue::new("interests", "L1", false),
            ],
        },
    ]
}
fn test_filter_1_expected_true_index(id: &str) -> HashMap<DimValue, HashSet<String>> {
    HashMap::from([
        (
            DimValue::new("gender", "empty", false),
            HashSet::from([
                format!("{id}_{seq}", id = id, seq = "0"),
                format!("{id}_{seq}", id = id, seq = "2"),
            ]),
        ),
        (
            DimValue::new("age", "empty", false),
            HashSet::from([format!("{id}_{seq}", id = id, seq = "4")]),
        ),
        (
            DimValue::new("interests", "L1", false),
            HashSet::from([format!("{id}_{seq}", id = id, seq = "4")]),
        ),
        (
            DimValue::new("age", "20", false),
            HashSet::from([
                format!("{id}_{seq}", id = id, seq = "2"),
                format!("{id}_{seq}", id = id, seq = "3"),
            ]),
        ),
        (
            DimValue::new("gender", "F", false),
            HashSet::from([
                format!("{id}_{seq}", id = id, seq = "1"),
                format!("{id}_{seq}", id = id, seq = "3"),
                format!("{id}_{seq}", id = id, seq = "4"),
            ]),
        ),
        (
            DimValue::new("age", "10", false),
            HashSet::from([
                format!("{id}_{seq}", id = id, seq = "0"),
                format!("{id}_{seq}", id = id, seq = "1"),
            ]),
        ),
        (
            DimValue::new("interests", "empty", false),
            HashSet::from([
                format!("{id}_{seq}", id = id, seq = "0"),
                format!("{id}_{seq}", id = id, seq = "2"),
            ]),
        ),
        (
            DimValue::new("interests", "L2,L3", true),
            HashSet::from([format!("{id}", id = id)]),
        ),
    ])
}

#[test]
fn test_filter_1_index() {
    let filter = test_filter_1("AD_1");
    let target_keys = TargetFilter::build_target_keys(&filter.filter().unwrap());
    let expected_target_keys = test_filter_1_expected_target_keys();
    assert_eq!(target_keys, expected_target_keys);

    let filters: Vec<TestFilter> = vec![filter];

    let mut filter_index = FilterIndex::default();
    filter_index.update(&filters, &vec![]);

    let id = &filters[0].id;
    let expected_true_index = test_filter_1_expected_true_index(id);
    let index = filter_index.index;
    assert_eq!(index, expected_true_index)
}
#[test]
fn test_new_filter_index() {
    let id = "AD_1";
    let filter = test_filter_1(id);
    let filters: Vec<TestFilter> = vec![filter];
    let mut filter_index = FilterIndex::default();
    filter_index.update(&filters, &vec![]);
    let user_info = HashMap::from([(
        String::from("age"),
        HashSet::from([String::from("10"), String::from("20")]),
    )]);

    let internal_ids = filter_index
        .search_positive_internal_ids(&user_info)
        .unwrap_or(HashSet::new());
    let expected_internal_ids = HashSet::from([
        format!("{id}_{seq}", seq = "0"),
        format!("{id}_{seq}", seq = "2"),
    ]);
    println!("{:?}", internal_ids);
    assert_eq!(internal_ids, expected_internal_ids);
}
#[test]
fn test_update_index_when_filter_changed() {
    let id = "AD_1";
    let user_info = HashMap::from([(
        String::from("age"),
        HashSet::from([String::from("10"), String::from("20")]),
    )]);
    let filter = TestFilter {
        id: String::from(id),
        filter: String::from(
            r#"
            {"type": "in", "dimension": "age", "values": ["10"]}
            "#,
        ),
    };
    let no_filter = TestFilter {
        id: String::from(id),
        filter: String::from(r#"{}"#),
    };

    // prev_filter: None, current_filter: Some
    let mut index = FilterIndex::default();
    index.update(&vec![TestFilter::from(&no_filter)], &vec![]);

    let mut result = index.search(&user_info);

    assert_eq!(result.contains(id), false);
    assert_eq!(index.non_filter_ids.contains(id), true);
    assert_eq!(index.filters.contains_key(id), false);

    index.update(&vec![filter], &vec![]);

    result = index.search(&user_info);
    assert_eq!(result.contains(id), true);
    assert_eq!(index.non_filter_ids.contains(id), false);
    assert_eq!(index.filters.contains_key(id), true);

    // prev_filter: Some, current_filter: None
    index.update(&vec![TestFilter::from(&no_filter)], &vec![]);
    result = index.search(&user_info);

    assert_eq!(result.contains(id), false);
    assert_eq!(index.non_filter_ids.contains(id), true);
    assert_eq!(index.filters.contains_key(id), false);
}
#[test]
fn test_update_index_when_filter_changed_prev_current_both_exist() {
    let id = "AD_1";
    let mut filter = TestFilter {
        id: String::from(id),
        filter: String::from(
            r#"
        {"type": "in", "dimension": "age", "values": ["10"]}
        "#,
        ),
    };
    let filters: Vec<TestFilter> = vec![filter];
    let mut index = FilterIndex::default();
    index.update(&filters, &vec![]);

    println!("[BEFORE]: {:?}", index);
    let user_info = HashMap::from([(String::from("age"), HashSet::from([String::from("10")]))]);
    let mut result = index.search(&user_info);

    assert_eq!(result.contains(id), true);
    filter = TestFilter {
        id: String::from(id),
        filter: String::from(
            r#"
            {"type": "in", "dimension": "age", "values": ["30"]}
            "#,
        ),
    };
    index.update(&vec![filter], &vec![]);
    println!("[AFTER]: {:?}", index);

    result = index.search(&user_info);
    assert_eq!(result.contains(id), false);
}

#[test]
fn test_filter_index() {
    let filter_1 = TestFilter {
        id: String::from("AD_1"),
        filter: String::from(
            r#"
            {"type": "in", "dimension": "age", "values": ["10"]}
            "#,
        ),
    };
    let filter_2 = TestFilter {
        id: String::from("AD_2"),
        filter: String::from(
            r#"
            {"type": "in", "dimension": "gender", "values": ["F"]}
            "#,
        ),
    };

    let expected_filter_index = FilterIndex {
        all_dimensions: HashMap::from([
            (String::from("age"), HashSet::from([String::from("AD_1")])),
            (
                String::from("gender"),
                HashSet::from([String::from("AD_2")]),
            ),
        ]),
        filters: HashMap::from([
            (
                String::from("AD_1"),
                TestFilter::from(&filter_1).filter().unwrap(),
            ),
            (
                String::from("AD_2"),
                TestFilter::from(&filter_2).filter().unwrap(),
            ),
        ]),
        index: HashMap::from([
            (
                DimValue::new("age", "10", false),
                HashSet::from([TargetFilter::to_internal_id(
                    &DimValue::new("age", "10", false),
                    "AD_1",
                    0,
                )]),
            ),
            (
                DimValue::new("age", "empty", false),
                HashSet::from([TargetFilter::to_internal_id(
                    &DimValue::new("age", "empty", false),
                    "AD_2",
                    0,
                )]),
            ),
            (
                DimValue::new("gender", "F", false),
                HashSet::from([TargetFilter::to_internal_id(
                    &DimValue::new("gender", "F", false),
                    "AD_2",
                    0,
                )]),
            ),
            (
                DimValue::new("gender", "empty", false),
                HashSet::from([TargetFilter::to_internal_id(
                    &DimValue::new("gender", "empty", false),
                    "AD_1",
                    0,
                )]),
            ),
        ]),
        non_filter_ids: HashSet::new(),
    };
    let mut filter_index = FilterIndex::default();
    filter_index.update(
        &vec![TestFilter::from(&filter_1), TestFilter::from(&filter_2)],
        &vec![],
    );

    check_equal(&filter_index, &expected_filter_index);

    filter_index.update(
        &vec![],
        &vec![TestFilter::from(&filter_1), TestFilter::from(&filter_2)],
    );
    check_equal(&filter_index, &FilterIndex::default());
}

fn check_equal(filter_index: &FilterIndex, expected_filter_index: &FilterIndex) {
    assert_eq!(
        filter_index.all_dimensions,
        expected_filter_index.all_dimensions
    );
    assert_eq!(filter_index.filters, expected_filter_index.filters);
    assert_eq!(filter_index.index, expected_filter_index.index);
    assert_eq!(
        filter_index.non_filter_ids,
        expected_filter_index.non_filter_ids
    );
}
