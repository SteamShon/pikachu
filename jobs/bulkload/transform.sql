INSTALL httpfs;
LOAD httpfs;
INSTALL json;
LOAD json;

SET s3_region='$s3_region';
SET s3_access_key_id='$s3_access_key_id';
SET s3_secret_access_key='$s3_secret_access_key';
DROP TABLE IF EXISTS user_feature;
CREATE TABLE user_feature AS (
    SELECT  '$cube_history_id' as cubeHistoryId, 
            userId as userId, 
            to_json({ratedMovieIds: list(movieId)}) as feature
    FROM    (
        SELECT  *
        FROM    read_parquet('s3://pikachu-dev/dataset/samples/movielens/ml-25m/ratings.parquet') 
    )
    GROUP BY userId
);
COPY (SELECT * FROM user_feature) TO '$output_file_name' (HEADER, DELIMITER ',');