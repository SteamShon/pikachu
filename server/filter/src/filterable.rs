use crate::filter::*;

pub trait Filterable {
    fn id(&self) -> String;
    fn filter(&self) -> Option<TargetFilter>;
}
