# Bulkloader

This is a set of scripts that creates a user feature dataset and populates a PostgreSQL table with it.

To alleviate the load on the PostgreSQL server, we only update the entire dataset every time. We use the COPY FROM command to achieve this.

## Getting Started

The entire process can be break into two part roughly.

#### Generate Dataset: followings are required specs.

Following is the example schema on dataset.

| UserId: String, Unique | ratedMovieIds: String[]     | genres: String[]           |
| ---------------------- | --------------------------- | -------------------------- |
| 2804                   | [247, 347, 441, 592]        | [Fantasy, Comedy, Romance] |
| 2808                   | [1, 50, 141, 165, 231, 296] | [Romance, Thriller, Drama] |

The above generated dataset will be transformed and imported into postgres table.

```sql
-- CreateTable
CREATE TABLE "UserFeature" (
    "cubeHistoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" JSONB,

    CONSTRAINT "UserFeature_pkey" PRIMARY KEY ("cubeHistoryId","userId")
) PARTITION BY LIST ("cubeHistoryId");
```

Note that we only use duckdb for small dataset(in this case movielens ml-25m), but if your data is large, then consider using ApacheSpark to generate dataset.

Also, current implementation use postgres to store 'UserFeature' but if your user is large or need optimized speed on retrieve 'UserFeature', then consider other storage options.

#### Register dataset into database and import it into Postgres

Once 'Cube' is configured on dashboard app by user, this script fetch aws s3 config stored in 'ServiceConfig', then use it to download cube dataset.

Also the operational process such as create new version on 'CubeHistory' and create new partition on 'UserFeature' according to created 'CubeHistory' is done by connecting postgres.

Followings are the tasks that run.py does.

1. Create Tables on database(by default it use prisma migration, so script will skip this).
2. Create new version number for new dataset.
3. Insert new version into "CubeHistory" table and get "cubeHistoryId" for import.
4. Download cube's parquet file on local as csv. it use download.sql to transform columns into jsonb column for postgresql.
5. Create new partition on "UserFeature".
6. Copy 4's result output csv file into postgresql using COPY FROM command.
7. Cleanup old partitions on "UserFeatures".

This process assumes that the 'UserFeatures' table only stores immutable datasets.
