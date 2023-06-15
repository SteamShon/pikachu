use std::sync::Arc;

use prisma_client_rust::{raw, QueryError};

use common::{
    db::{user_feature, PrismaClient},
    types::UserInfo,
    util::parse_user_info,
};
use futures::future::join_all;

#[derive(Debug, Clone)]
pub struct UserFeatureDatabase {
    // pub integration: integration::Data,
    pub client: Arc<PrismaClient>,
    pub database_url: String,
    pub table_partition: String,
}

// #[async_trait]
// impl Integration<UserInfo> for UserFeatureDatabase {

impl UserFeatureDatabase {
    pub async fn apply(&self, user_id: &str) -> Option<UserInfo> {
        let client = &self.client;
        let queries = self.generate_user_feature_sqls(user_id)?;
        let futures = join_all(queries.into_iter().map(|query| async move {
            let user_features: Result<Vec<user_feature::Data>, QueryError> =
                client._query_raw(query).exec().await;

            user_features
        }))
        .await;

        let mut user_info = UserInfo::new();
        for future in futures {
            match future {
                Ok(user_features) => {
                    for user_feature in user_features {
                        if let Some(kvs) = parse_user_info(&user_feature.feature) {
                            for (k, v) in kvs {
                                user_info.insert(k, v);
                            }
                        }
                    }
                }
                Err(e) => println!("Got an error: {}", e),
            }
        }
        Some(user_info)
    }

    fn generate_user_feature_sqls(&self, user_id: &str) -> Option<Vec<prisma_client_rust::Raw>> {
        let mut queries = Vec::new();
        let version = &self.table_partition;
        let sql = format!(
            r#"
            SELECT  *
            FROM    "UserFeature"
            WHERE   "version" = '{}'
            AND     "userId" = '{}'
        "#,
            version, user_id
        );
        println!("{:?}", sql);
        let query = raw!(&sql);
        queries.push(query);

        Some(queries)
    }
}
