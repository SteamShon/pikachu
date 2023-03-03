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
    for (index, target_key) in target_keys.iter().enumerate() {
        println!("{:?}: {:?}", index, target_key);
    }

    let filters: Vec<TestFilter> = vec![filter];

    let filter_index = FilterIndex::new(&filters);

    println!("{:?}", filter_index.debug());
    let user_info = HashMap::from([(
        String::from("age"),
        HashSet::from([String::from("10"), String::from("20")]),
    )]);

    let internal_ids = filter_index.search_positive_internal_ids(&user_info);
    println!("{:?}", internal_ids);
}
