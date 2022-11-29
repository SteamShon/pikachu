use avrow;
use jsonschema;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Error {
    SerdeJsonError,
    JsonSchemaError,
    AvroError,
    SchemaNotMatchedError,
    InvalidJsonEvent,
    PublishError
}

#[derive(Clone)]
pub enum Schema {
    Json(jsonschema::JSONSchema),
    Avro(avrow::Schema)
}