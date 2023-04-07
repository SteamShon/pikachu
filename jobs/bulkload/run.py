import os, sys
import psycopg2
from psycopg2.extras import RealDictCursor
from cuid2 import CUID
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

# 2. GENERATE version
print("2. Generate Version")
query = "select to_char(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') AS version"

cursor.execute(query)
result = cursor.fetchone()
version = result['version']
print(version)

# 3. get cubeId from cubes by name
print("3. GET CubeId f rom Cube by name")
query = f'select * from "Cube" where name = \'{cube_name}\''
cursor.execute(query)
result = cursor.fetchone()
cube_id = result['id'] 

# 4. create cube_history
print("4. CREATE new version on CubeHistory")
cube_history_id = CUID().generate()
query = f'insert into "CubeHistory"("id", "cubeId", "version", "createdAt", "updatedAt") VALUES (\'{cube_history_id}\', \'{cube_id}\', \'{version}\', now(), now()) '
cursor.execute(query)
conn.commit()

# 5. generate dataset
print("5. Download Dataset As CSV")
sql = open("download.sql", "r").read()
query = Template(sql).substitute(
    s3_region = s3_config['s3Region'],
    s3_access_key_id = s3_config['s3AccessKeyId'],
    s3_secret_access_key = s3_config['s3SecretAccessKey'],
    cube_history_id = cube_history_id,
    input_path = 's3://pikachu-dev/dataset/samples/movielens/ml-25m/user_feature.parquet',
    output_file_name = 'output.csv'
)
start = time.time()
duckdb.sql(query)
end = time.time()
print("took %d" % (end - start))

# 6. create partition 
print("6. Create Partition on UserFeature Table")
partition = f'UserFeature_{cube_history_id}'
query = f'CREATE TABLE IF NOT EXISTS "{partition}" PARTITION OF "UserFeature" FOR VALUES IN (\'{cube_history_id}\')'
cursor.execute(query)
conn.commit()

# 7. run postgresql copy from command 
print("7. COPY FROM output csv file")
with open('output.csv') as f:
    start = time.time()
    cursor.copy_expert("""COPY "%s" FROM STDIN CSV HEADER DELIMITER ','""" % partition, f)
    end = time.time()
    print("took %d" % (end - start))
conn.commit()

# 8. cleanup old partitions 
query = """SELECT * FROM "CubeHistory" where "cubeId" = '%s' ORDER BY version DESC""" % cube_id
cursor.execute(query)
results = cursor.fetchall()
num_versions = 3
n = len(results) - num_versions
versions_to_delete = results[-n:]

for cube_history in versions_to_delete:
    print("Cleanup partition ")
    cube_history_id = cube_history['id']
    partition = """UserFeature_%s""" % cube_history_id
    query = """DROP TABLE "%s" """ % partition
    cursor.execute(query) 
    query = """DELETE FROM "CubeHistory" WHERE id = '%s'""" % cube_history_id
    cursor.execute(query)
    conn.commit()
conn.close()

'''explain 
SELECT *
FROM "UserFeature" 
WHERE "cubeHistoryId" = (SELECT id
FROM   "CubeHistory" h
WHERE  h."cubeId" = 'clg56xbwk000dv7k4pfzc7ppb'
ORDER BY version DESC 
LIMIT 1)
AND   "userId" = '1'
'''