# Goal

This library provide following features.

Given set of entity(Filter) which has combinations of predicates,

1. Provide indexing set of filters into embedded inverted index data structure.
2. Provide way to find out filters which predicates matches to given data.

## Example Filter

Example of combination of predicates.

```text
Or {
    In("age", "10", "20"),
    And (
        In ("gender", "F")
        Or (
            In ("interests", "L1")
            And (
                In ("age", "10", "20"),
                Not (
                    In ("interests", "L2,L3")
                )
            )
        )
    )
}
```

The library provide following trait so user can attach filter on their own entity(ex: Product, Video, NewsArticle, Song,...) by implementing `Filterable` trait.

```text
//library
pub trait Filterable {
    fn id(&self): String;
    fn filter(&self): Filter;
}
//client
impl Filterable for MyNewsArticle {
    fn id(&self): String {
        String::from(self.uuid)
    }
    fn filter(&self): Fitler {
        Filter::from(self.filter_raw_string)
    }
}

// example
Ad_1: {
    id: "Ad_1", // any unique id to identify your entity.
    filter:
        Or {
            In("age", "10", "20"),
            And (
                In ("gender", "F")
                Or (
                    In ("interests", "L1")
                    And (
                        In ("age", "10", "20"),
                        Not (
                            In ("interests", "L2,L3")
                        )
                    )
                )
            )
        }
}
```

## Explanation for an example

Followings are an step-by-step explanations on what actually goes on under the hood.

Assume we only have one Filter.

````text
Ad_1: {
    id: "ad_1", // any unique id to identify your entity.
    filter: ```
        Or {
            In("age", "10", "20"),
            And (
                In ("gender", "F")
                Or (
                    In ("interests", "L1")
                    And (
                        In ("age", "10", "20"),
                        Not (
                            In ("interests", "L2,L3")
                        )
                    )
                )
            )
        }```
}

### 1. all_dimensions: Set<String>

- Iterate through all filters and create a set of all dimensions used in the current registered filteres universe, called all_dimensions
- since our example only have one filter, following is what all_dimension looks like.

```text
all_dimensions: ["age", "gender", "interests"]
````

### 2. target_keys: Set<String>

- Determine the combination of conditions (target_keys) that must match for each filter.
- single predicate consists of dim and value joined with "." as delimiter.
- set of predicates can be one predicate(ex: AND/OR/NOT).
- thinks filter.target_keys as all possible combinations that need to be matched.

```text
target_keys = [
    "age.20", // OR
    "age.10", // OR
    "gender.F_AND_interests.L1", // OR
    "gender.F_AND_age.20_AND_NOT_interests.L2,L3", // OR
    "gender.F_AND_age.10_AND_NOT_interests.L2,L3" // OR
]
```

### 3. build true_index/false_index to help fast search.

- true_index to gernerate positive candidates and false_index to generate negative candidates.
- Once positive/negative candidates built, matched filters are simply positive set - negative set.

Followings are notes on build index.

- For the dimensions that exist in all_dimensions but not in target_keys, add special values called "empty".
- Concatenate the filter's id and the index of target_keys to use as a unique internal id.
  - Since each predicates in target_keys is an `OR` condition, split one filter id into n separate internal id, each treated as a separate filter for each condition.
- For each single predicate, if it is Not, then index it into false_index, otherwise index it into true_index.

```text
target_keys = [
    ["age.20", "gender.empty", "interests.empty"], // ad_1_0
    ["age.10", "gender.empty", "interests.empty"], // ad_1_1
    ["age.empty", "gender.F", "interests.L1"], // ad_1_2
    ["age.20", "gender.F", "NOT_interests.L2,L3"], // ad_1_3
    ["age.10", "gender.F", "NOT_interests.L2,L3"], // ad_1_4
]

true_index = {
    "age.20": ["ad_1_0", "ad_1_3"],
    "gender.empty": ["ad_1_0", "ad_1_1"],
    "interests.empty": ["ad_1_0", "ad_1_1"],
    "age.10": ["ad_1_1", "ad_1_4"],
    "age.empty": ["ad_1_2"],
    "gender.F": ["ad_1_2", "ad_1_3", "ad_1_4"],
    "interests.L1": ["ad_1_2"],
}
false_index = {
    "interests.L2,L3": ["ad_1_3", "ad_1_4"]
}
```

### 4. build user_meta for search

- Combine user_info with all_dimensions to create keys for index lookup, called user_meta.
- If user provided data missing dimensions, then pad Set("empty") as value for these dimensions.

```text
//pseudo-code
base_user_info = all_dimensions.map(|dim| dim -> Set("empty"));
user_info = base_user_info ++ user_info;
```

```text
all_dimensions = ["age", "gender", "interests"]
// only one dimension has user provided value.
user_provided_data = {
    "age": ["10"]
}
//merged user_meta
user_meta = {
    "age": ["10"],
    "gender": ["empty"],
    "interests": ["empty"],
}
```

### 5. search true_index/false_index for given user_meta.

#### positive candidates

Given user_meta, per each dimensions, generate match candidates.

- dimension with values provided
  - true_index[`dim.empty`] | true_index[`dim.#{value_0}`] | true_index[`dim.#{value_1}`] ...
- dimension without values provided
  - true_index[`dim.empty`]

Once finshing with generating candidates for all dimension, intersect those sets to generate positive candidates. - once done with this process, it is not necessary to keep target_key's index on internal id so convert them into original id by remove index.

```text
true_index = {
    "age.20": ["ad_1_0", "ad_1_3"],
    "gender.empty": ["ad_1_0", "ad_1_1"],
    "interests.empty": ["ad_1_0", "ad_1_1"],
    "age.10": ["ad_1_1", "ad_1_4"],
    "age.empty": ["ad_1_2"],
    "gender.F": ["ad_1_2", "ad_1_3", "ad_1_4"],
    "interests.L1": ["ad_1_2"],
}
false_index = {
    "interests.L2,L3": ["ad_1_3", "AD_1_4"]
}
user_meta = {
    "age": ["10"],
    "gender": ["empty"],
    "interests": ["empty"],
}
ads_for_true_index = [
    "age.empty" | "age.10" -> ["ad_1_2"] | ["ad_1_1", "ad_1_4"] = ["ad_1_1", "ad_1_2", "ad_1_4"]
    "gender.empty" -> ["ad_1_0", "ad_1_1"]
    "interests.empty" -> ["ad_1_0", "ad_1_1"]
]
matched_ads_for_true_index = ["ad_1_1"] = ["ad_1"]
```

#### negative candidates

Given user_meta, only dimensions with values provided need to lookup false index to generate dimension's candidates.
Once finshing with generating candidates for all dimension, union those sets to generate negative candidates.

```text
ads_for_false_index = [
    "age.10" -> []
]

matched_ads_for_false_index = []
```

#### result

- positve candidates - negative candidates

```text
results = matched_ads_for_true_index - matched_ads_for_false_index = ["ad_1"] - [] = ["ad_1"]
```

### More example cases for search.

```text
true_index = {
    "age.20": ["ad_1_0", "ad_1_3"],
    "gender.empty": ["ad_1_0", "ad_1_1"],
    "interests.empty": ["ad_1_0", "ad_1_1"],
    "age.10": ["ad_1_1", "ad_1_4"],
    "age.empty": ["ad_1_2"],
    "gender.F": ["ad_1_2", "ad_1_3", "ad_1_4"],
    "interests.L1": ["ad_1_2"],
}
false_index = {
    "interests.L2,L3": ["ad_1_3", "AD_1_4"]
}
```

#### case 1: If gender.F exists in user_info, then do not display (set to false).

```text
user_meta = {
    "age": ["empty"],
    "gender": ["F"],
    "interests": ["empty"]
}

ads_for_true_index = [
    "age.empty" -> ["ad_1_2"]
    "gender.F" | "gender.empty" ->
        ["ad_1_2", "ad_1_3", "ad_1_4"] | ["ad_1_0", "ad_1_1"] =
        ["ad_1_0", "ad_1_1", "ad_1_2", "ad_1_3", "ad_1_4"]
    "interests.empty" -> ["ad_1_0", "ad_1_1"]
]

matched_ads_for_true_index = []

ads_for_false_index = [
    "gender.F" -> []
]

matched_ads_for_false_index = []

results = matched_ads_for_true_index - matched_ads_for_false_index = [] - [] = []
```

#### case 2: Display (set to true) based on the two conditions: age.10 and gender.F_AND_interests.L1.

```text
user_meta = {
    "age": ["10"],
    "gender": ["F"],
    "interests": ["L1"]
}

ads_for_true_index = [
    "age.empty" | "age.10" -> ["ad_1_2"] | ["ad_1_1", "ad_1_4"] = ["ad_1_1", "ad_1_2", "ad_1_4"]
    "gender.empty" | "gender.F" ->
        ["ad_1_0", "ad_1_1"] |
        ["ad_1_2", "ad_1_3", "ad_1_4"] =
        ["ad_1_0", "ad_1_1", "ad_1_2", "ad_1_3", "ad_1_4"]
    "interests.empty" | "interests.L1" ->
        ["ad_1_0", "ad_1_1"] |
        ["ad_1_2"] =
        ["ad_1_0", "ad_1_1", "ad_1_2"]
]

matched_ads_for_true_index = ["ad_1_1", "ad_1_2"]

ads_for_false_index = [
    "age.10" -> []
    "gender.F" -> []
    "interests.L1" -> []
]

matched_ads_for_false_index = []

results = matched_ads_for_true_index - matched_ads_for_false_index = ["ad_1_1", "ad_1_2"] - [] = ["ad_1_1", "ad_1_2"]
```

#### case 3: Although there is a match for the age.20 condition, it will not be displayed due to age.20_AND_gender.F_AND_NOT_interests.L2,L3 and age.10_AND_gender.F_AND_NOT_interests.L2,L3 conditions

```text
user_meta = {
    "age": ["20"],
    "gender": ["F"],
    "interests": ["L2,L3"]
}

ads_for_true_index = [
    "age.empty" | "age.20" -> ["ad_1_2"] | ["ad_1_0", "ad_1_3"] = ["ad_1_0", "ad_1_2", "ad_1_3"]
    "gender.empty" | "gender.F" ->
        ["ad_1_0", "ad_1_1"] | ["ad_1_2", "ad_1_3", "ad_1_4"] =
        ["ad_1_0", "ad_1_1", "ad_1_2", "ad_1_3", "ad_1_4"]
    "interests.empty" | "interests.L2,L3" -> ["ad_1_0", "ad_1_1"] | [] = ["ad_1_0", "ad_1_1"]
]

matched_ads_for_true_index = ["ad_1_0"]

ads_for_false_index = [
    "age.20" -> []
    "gender.F" -> []
    "interests.L2,L3" -> ["ad_1_3", "AD_1_4"]
]

matched_ads_for_false_index = ["ad_1_3", "AD_1_4"]

results = matched_ads_for_true_index - matched_ads_for_false_index =
    ["ad_1_0"] - ["ad_1_3", "AD_1_4"] =
    ["ad_1"] - ["ad_1"] = []
```

#### case 4: Although gender.F AND interests.L1 match, it will not be displayed due to interests.L2,L3.

```text
user_meta = {
    "age": ["20"],
    "gender": ["F"],
    "interests": ["L1", "L2,L3"]
}

ads_for_true_index = [
    "age.empty" | "age.20" -> ["ad_1_2"] | ["ad_1_0", "ad_1_3"] = ["ad_1_0", "ad_1_2", "ad_1_3"]
    "gender.empty" | "gender.F" ->
        ["ad_1_0", "ad_1_1"] | ["ad_1_2", "ad_1_3", "ad_1_4"] =
        ["ad_1_0", "ad_1_1", "ad_1_2", "ad_1_3", "ad_1_4"]
    "interests.empty" | "interests.L1" | "interests.L2,L3" -> ["ad_1_0", "ad_1_1"] | ["ad_1_2"] | [] = ["ad_1_0", "ad_1_1", "ad_1_2"]
]

matched_ads_for_true_index = ["ad_1_0", "ad_1_2"]

ads_for_false_index = [
    "age.20" -> []
    "gender.F" -> []
    "interests.L1" | "interests.L2,L3" ->
        [] | ["ad_1_3", "AD_1_4"] = ["ad_1_3", "AD_1_4"]
]

matched_ads_for_false_index = ["ad_1_3", "AD_1_4"]

results = matched_ads_for_true_index - matched_ads_for_false_index =
    ["ad_1_0", "ad_1_2"] - ["ad_1_3", "AD_1_4"] =
    ["ad_1"] - ["ad_1"] = []
```
