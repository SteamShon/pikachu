use crate::db::ad_group;
use crate::filter::*;

pub trait Filterable {
    fn id(&self) -> &str;
    fn filter(&self) -> Option<TargetFilter>;
}

impl Filterable for ad_group::Data {
    fn id(&self) -> &str {
        &self.id
    }

    fn filter(&self) -> Option<TargetFilter> {
        match &self.filter {
            None => None,
            Some(s) => {
                let value: serde_json::Value = serde_json::from_str(&s).ok()?;
                TargetFilter::from(&value)
            }
        }
    }
}
