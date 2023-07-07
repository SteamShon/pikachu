use std::collections::HashSet;

use serde_json::{json, Value};

use crate::filter::TargetFilter;

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
            let fields: Vec<_> = fields.iter().map(|f| to_json(f)).collect();
            json!({
                "type": "and",
                "fields": fields
            })
        }
        TargetFilter::Or { fields } => {
            let fields: Vec<_> = fields.iter().map(|f| to_json(f)).collect();
            json!({
                "type": "or",
                "fields": fields
            })
        }
        TargetFilter::Not { field } => {
            json!({
                "type": "not",
                "field": to_json(field)
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
            let fields: Vec<_> = fields.iter().map(|f| to_jsonlogic(f)).collect();
            json!({ "and": fields })
        }
        TargetFilter::Or { fields } => {
            let fields: Vec<_> = fields.iter().map(|f| to_jsonlogic(f)).collect();
            json!({ "or": fields })
        }
        TargetFilter::Not { field } => {
            json!({ "!": to_jsonlogic(field) })
        }
    }
}
pub fn from_jsonlogic(value: &Value) -> Option<TargetFilter> {
    if !&value["!"].is_null() {
        let field = Box::new(from_jsonlogic(&value["!"])?);
        return Some(TargetFilter::Not { field });
    }
    if let Value::Array(childrens) = &value["and"] {
        let fields: Vec<TargetFilter> = childrens
            .iter()
            .flat_map(|child| from_jsonlogic(child))
            .collect();
        return Some(TargetFilter::And { fields });
    }
    if let Value::Array(childrens) = &value["or"] {
        let fields: Vec<TargetFilter> = childrens
            .iter()
            .flat_map(|child| from_jsonlogic(child))
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
pub fn from_json(value: &Value) -> Option<TargetFilter> {
    match value["type"].as_str() {
        None => None,
        Some(t) => match t {
            "in" => {
                let dimension = value["dimension"].as_str()?.to_string();
                let mut valid_values = HashSet::new();
                for value in value["values"].as_array()? {
                    if let Some(v) = value.as_str() {
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
                    .flat_map(|field| from_json(field))
                    .collect();
                Some(TargetFilter::And { fields })
            }
            "or" => {
                let fields: Vec<TargetFilter> = value["fields"]
                    .as_array()?
                    .iter()
                    .flat_map(|field| from_json(field))
                    .collect();
                Some(TargetFilter::Or { fields })
            }
            "not" => Some(TargetFilter::Not {
                field: Box::new(from_json(&value["field"])?),
            }),
            _ => None,
        },
    }
}
