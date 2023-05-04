pub mod publisher;
pub mod meta;

use std::{collections::HashMap, env};
use actix_cors::Cors;
use actix_web::{
    middleware::Logger,
    post,
    web::{self, Bytes},
    App, HttpResponse, HttpServer, Responder,
};
use dotenv::dotenv;
use publisher::Publisher;
use schema_registry_converter::async_impl::schema_registry::SrSettings;


#[post("/publish/{service_id}")]
async fn publish<'a>(
    data: web::Data<Publisher<'a>>,
    body: Bytes,
    path: web::Path<String>,
) -> impl Responder {
    let service_id = path.into_inner();
    let topic = "events";
    // let topic = data.get_topic(service_id.as_str());
    // if let None = topic {
    //     return HttpResponse::BadRequest().json(false)
    // }
    let event: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let result = 
        data.publish(topic, &event).await;
    
    println!("{:?}", result);

    //TODO: 
    match result {
        Ok(x) => HttpResponse::Ok().json(true),
        Err((error, message)) => HttpResponse::InternalServerError().json(false)
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    dotenv().ok();

    println!("{:?}", env::vars());

    let producer_configs = 
        env::var("BOOTSTRAP_SERVERS").ok().map(|v| 
            HashMap::from([("bootstrap.servers", v)]
        ));
    let schema_registry_settings = 
        env::var("SCHEMA_REGISTRY_URL").ok().map(|v| SrSettings::new(v));
    let publisher = Publisher::new(
        schema_registry_settings, 
        producer_configs
    );
    let data = web::Data::new(publisher);

    HttpServer::new(move || {
        let cors = Cors::permissive();
        let logger = Logger::default();

        App::new()
            .app_data(data.clone())
            // .app_data(client.clone())
            .service(publish)
            .wrap(cors)
            .wrap(logger)
    })
    .bind(("0.0.0.0", 8181))?
    .run()
    .await

    
}
