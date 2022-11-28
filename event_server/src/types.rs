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