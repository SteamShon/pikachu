
-- Create Partitions
CREATE TABLE "CreativeStat_202301" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-01-01') TO ('day', '2023-02-01');

CREATE TABLE "CreativeStat_202302" PARTITION OF "CreativeStat" 
FOR VALUES FROM ('day', date '2023-02-01') TO ('day', '2023-03-01');

CREATE TABLE "CreativeStat_202303" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-03-01') TO ('day', '2023-04-01');

CREATE TABLE "CreativeStat_202304" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-04-01') TO ('day', '2023-05-01');

CREATE TABLE "CreativeStat_202305" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-05-01') TO ('day', '2023-06-01');

CREATE TABLE "CreativeStat_202306" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-06-01') TO ('day', '2023-07-01');

CREATE TABLE "CreativeStat_202307" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-07-01') TO ('day', '2023-08-01');

CREATE TABLE "CreativeStat_202308" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-08-01') TO ('day', '2023-09-01');

CREATE TABLE "CreativeStat_202309" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-09-01') TO ('day', '2023-10-01');

CREATE TABLE "CreativeStat_202310" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-10-01') TO ('day', '2023-11-01');

CREATE TABLE "CreativeStat_202311" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-11-01') TO ('day', '2023-12-01');

CREATE TABLE "CreativeStat_202312" PARTITION OF "CreativeStat"
FOR VALUES FROM ('day', date '2023-12-01') TO ('day', '2024-01-01');