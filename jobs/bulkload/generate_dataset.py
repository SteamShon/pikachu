import os, sys
import psycopg2
from psycopg2.extras import RealDictCursor
from string import Template
import duckdb
import time

cube_name="test"

conn = psycopg2.connect(user="postgres", password="postgres", host="localhost", port="5432", database="postgres")
cursor = conn.cursor(cursor_factory=RealDictCursor)

# 1. Get AWS S3 Config from ServiceConfig
print("1. Get Credentials from ServiceConfig")
cursor.execute("""
               SELECT   sc."s3Config"
               FROM     "ServiceConfig" sc, "Cube" c
               WHERE    sc."id" = c."serviceConfigId"
               AND      c.name = '%s'
               """ % cube_name)
s3_config = cursor.fetchone()
s3_config = s3_config['s3Config']

if s3_config == None: 
    print("Can't proceed without ServiceConfig.s3Config. go to dashboard then register valid s3Config")
    exit()
print(s3_config)

sql = open("generate_dataset.sql", "r").read()
query = Template(sql).substitute(
    s3_region = s3_config['s3Region'],
    s3_access_key_id = s3_config['s3AccessKeyId'],
    s3_secret_access_key = s3_config['s3SecretAccessKey'],
    input_path = 's3://pikachu-dev/dataset/samples/movielens/ml-25m/ratings.parquet',
    output_path = 's3://pikachu-dev/dataset/samples/movielens/ml-25m/user_feature.parquet'
)
print(query)
start = time.time()
duckdb.sql(query)
end = time.time()
print("took %d" % (end - start))
