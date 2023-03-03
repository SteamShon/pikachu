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
#[test]
fn test_new_filter_index() {
    let filter = TestFilter {
        id: String::from("AD_1"),
        filter: String::from(
            r#"
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
    }"#,
        ),
    };
    let target_keys = build_target_keys(&filter.filter().unwrap());
    let expected_target_keys = vec![
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
    ];
    assert_eq!(target_keys, expected_target_keys);

    let filters: Vec<TestFilter> = vec![filter];

    let filter_index = FilterIndex::new(&filters);
    let id = &filters[0].id;
    let expected_true_index = json!({
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
    });
    let true_index_debug = FilterIndex::debug_index(&filter_index.true_index.lock().unwrap());
    assert_eq!(true_index_debug, expected_true_index);

    println!("{:?}", true_index_debug);
    let user_info = HashMap::from([(
        String::from("age"),
        HashSet::from([String::from("10"), String::from("20")]),
    )]);

    let internal_ids = filter_index
        .search_positive_internal_ids(&user_info)
        .unwrap_or(HashSet::new());
    let expected_internal_ids = HashSet::from([String::from("AD_1_0"), String::from("AD_1_2")]);
    println!("{:?}", internal_ids);
    assert_eq!(internal_ids, expected_internal_ids);
}
