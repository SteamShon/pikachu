use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Error {
    SerdeJsonError,
    JsonSchemaError,
    AvroError,
    SchemaNotMatchedError,
    InvalidJsonEvent,
    PublishError
}

pub enum Schema {
    Json(jsonschema::JSONSchema),
    Avro(avrow::Schema)
}