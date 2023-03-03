use super::*;
use lazy_static::lazy_static;
use serde_json::{Result, Value};
use std::collections::HashSet;
use TargetFilter::*;

struct TestFilter {
    id: String,
    filter: String,
}
impl Filterable for TestFilter {
    fn id(&self) -> &str {
        &self.id
    }

    fn filter(&self) -> Option<TargetFilter> {
        let value: Value = serde_json::from_str(&self.filter).ok()?;
        TargetFilter::from(&value)
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
fn test_filter_1_expected_true_index(id: &str) -> serde_json::Value {
    json!({
        DimValue::new("gender", "empty", false).debug():
            vec![
                format!("{id}_{seq}", id = id, seq = "0"),
                format!("{id}_{seq}", id = id, seq = "2"),
            ],
        DimValue::new("age", "empty", false).debug():
            vec![
                format!("{id}_{seq}", id = id, seq = "4"),
            ],
        DimValue::new("interests", "L1", false).debug():
            vec![
                format!("{id}_{seq}", id = id, seq = "4")
            ],
        DimValue::new("age", "20", false).debug():
            vec![
                format!("{id}_{seq}", id = id, seq = "2"),
                format!("{id}_{seq}", id = id, seq = "3")
            ],
        DimValue::new("gender", "F", false).debug():
            vec![
                format!("{id}_{seq}", id = id, seq = "1"),
                format!("{id}_{seq}", id = id, seq = "3"),
                format!("{id}_{seq}", id = id, seq = "4")
            ],
        DimValue::new("age", "10", false).debug():
            vec![
                format!("{id}_{seq}", id = id, seq = "0"),
                format!("{id}_{seq}", id = id, seq = "1")
            ],
        DimValue::new("interests", "empty", false).debug():
            vec![
                format!("{id}_{seq}", id = id, seq = "0"),
                format!("{id}_{seq}", id = id, seq = "2")
            ],
    })
}
fn test_filter_1_expected_false_index(id: &str) -> serde_json::Value {
    json!({
        DimValue::new("interests", "L2,L3", true).debug():
            vec![
                format!("{id}", id = id),
            ],
    })
}
#[test]
fn test_filter_1_index() {
    let filter = test_filter_1("AD_1");
    let target_keys = build_target_keys(&filter.filter().unwrap());
    let expected_target_keys = test_filter_1_expected_target_keys();
    assert_eq!(target_keys, expected_target_keys);

    let filters: Vec<TestFilter> = vec![filter];

    let filter_index = FilterIndex::new(&filters);
    let id = &filters[0].id;
    let expected_true_index = test_filter_1_expected_true_index(id);
    let true_index_debug = FilterIndex::debug_index(&filter_index.true_index.lock().unwrap());
    assert_eq!(true_index_debug, expected_true_index);
    let false_index_debug = FilterIndex::debug_index(&filter_index.false_index.lock().unwrap());
    let expected_false_index = test_filter_1_expected_false_index(id);
    assert_eq!(false_index_debug, expected_false_index);
}
#[test]
fn test_new_filter_index() {
    let id = "AD_1";
    let filter = test_filter_1(id);
    let filters: Vec<TestFilter> = vec![filter];
    let filter_index = FilterIndex::new(&filters);
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
