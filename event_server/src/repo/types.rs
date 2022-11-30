use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Error {
    SerdeJsonError,
    JsonSchemaError,
    AvroError,
    SchemaNotMatchedError,
    InvalidJsonEvent,
    SchemaIsInvalid,
    EventDataNotObject,
    PublishError
}

pub enum Schema {
    Json(jsonschema::JSONSchema),
    Avro(apache_avro::Schema)
}