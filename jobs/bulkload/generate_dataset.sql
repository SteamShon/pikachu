INSTALL httpfs;
LOAD httpfs;
INSTALL json;
LOAD json;

SET enable_progress_bar=true;
-- SET memory_limit='4GB';
-- SET threads TO 4;

SET s3_region='$s3_region';
SET s3_access_key_id='$s3_access_key_id';
SET s3_secret_access_key='$s3_secret_access_key';
DROP TABLE IF EXISTS user_feature;
DROP TABLE IF EXISTS with_genres;

CREATE TABLE with_genres AS (
    SELECT  userId, 
            list(genre) AS genres
    FROM    (
        SELECT  DISTINCT 
                    t_0.userId AS userId, 
                    UNNEST(str_split(t_1.genres, '|')) AS genre
        FROM    read_parquet(['s3://pikachu-dev/dataset/samples/movielens/ml-25m/ratings.parquet']) AS t_0
        JOIN    read_parquet(['s3://pikachu-dev/dataset/samples/movielens/ml-25m/movies.parquet']) AS t_1 ON t_0.movieId = t_1.movieId
    )
    GROUP BY userId
);

CREATE TABLE user_feature AS (
    SELECT  a.userId, a.ratedMovieIds, b.genres
    FROM    (
        SELECT  userId,  
                list(movieId) AS ratedMovieIds
        FROM    read_parquet(['s3://pikachu-dev/dataset/samples/movielens/ml-25m/ratings.parquet'])
        GROUP BY userId
    ) a join with_genres b ON (a.userId = b.UserId)
);

COPY (SELECT * FROM user_feature) TO '$output_path';