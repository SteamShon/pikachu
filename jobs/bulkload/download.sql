INSTALL httpfs;
LOAD httpfs;
INSTALL json;
LOAD json;

SET s3_region='$s3_region';
SET s3_access_key_id='$s3_access_key_id';
SET s3_secret_access_key='$s3_secret_access_key';
DROP TABLE IF EXISTS download;
CREATE TABLE download AS (
    SELECT  '$cube_history_id' AS cubeHistoryId,
            userId as userId,
            to_json((ratedMovieIds, genres)) as feature
    FROM    read_parquet('$input_path') 
);
COPY (SELECT * FROM download) TO '$output_file_name' (HEADER, DELIMITER ',');