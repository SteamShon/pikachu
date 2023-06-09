
use std::collections::{HashMap, HashSet};
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize)]
pub struct DimValue {
    pub dimension: String,
    pub value: String,
    pub is_not: bool,
}
impl DimValue {
    pub fn debug(&self) -> String {
        format!(
            "{is_not}.{dimension}.{value}",
            is_not = self.is_not,
            dimension = self.dimension,
            value = self.value
        )
    }
    pub fn new(dim: &str, value: &str, is_not: bool) -> Self {
        DimValue {
            dimension: String::from(dim),
            value: String::from(value),
            is_not,
        }
    }
}
pub type UserInfo = HashMap<String, HashSet<String>>;
