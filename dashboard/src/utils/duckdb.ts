import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import * as duckdb from "@duckdb/duckdb-wasm";
import type { CubeConfig } from "@prisma/client";

export async function loadDuckDB(
  cubeConfig: CubeConfig
): Promise<AsyncDuckDB | undefined> {
  const allBundles = duckdb.getJsDelivrBundles();
  const bestBundle = await duckdb.selectBundle(allBundles);

  console.log(bestBundle);
  if (!bestBundle.mainWorker) {
    console.error("can't initialize workder");
    return Promise.resolve(undefined);
  }

  const worker = await duckdb.createWorker(bestBundle.mainWorker);
  // Instantiate the asynchronus version of DuckDB-wasm
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bestBundle.mainModule, bestBundle.pthreadWorker);

  // set s3 config.
  const setQuery = `
SET home_directory='/tmp/';
SET s3_region='${cubeConfig.s3Region}';
SET s3_access_key_id='${cubeConfig.s3AccessKeyId}';
SET s3_secret_access_key='${cubeConfig.s3SecretAccessKey}';
  `;

  await executeQuery(db, setQuery);

  console.log("duckdb: load db instance success.");

  return db;
}

export async function executeQuery(
  db: AsyncDuckDB,
  query: string
): Promise<Record<string, unknown>[]> {
  console.log(`duckdb: ${query}`);
  const conn = await db.connect();

  const result = await conn.query(query);

  return result.batches.flatMap((rows) => {
    const buffer: Record<string, unknown>[] = [];
    for (let r = 0; r < rows.numRows; r++) {
      const row = rows.get(r);
      if (!row) return {};
      // const kvs = Object.entries(row.toJSON()).map(([key, value]) => {
      //   return [key, value];
      // });
      const kvs: { [x: string]: unknown } = {};
      Object.entries(row.toJSON()).forEach(([key, value]) => {
        // console.log(typeof value);
        // if (typeof value === "object") {
        //   console.log(value);
        // }
        kvs[key] = typeof value === "bigint" ? value.toString() : value;
      });

      buffer.push(kvs);
    }
    return buffer;
  });
}
/*
export const ParquetMetadataColumns = [
  // "row_group_id",
  // "row_group_num_rows",
  // "row_group_num_columns",
  // "row_group_bytes",
  // "column_id",
  // "file_offset",

  "num_values",
  "path_in_schema",
  "type",

  "stats_min",
  "stats_max",
  "stats_null_count",
  "stats_distinct_count",
  "stats_min_value",
  "stats_max_value",

  // "compression",
  // "encodings",
  // "index_page_offset",
  // "dictionary_page_offset",
  // "data_page_offset",

  // "total_compressed_size",
  // "total_uncompressed_size",
];
export const ParquetMetadataColumns = [
  "column_name",
  "column_type",
  "min",
  "max",
  "approx_unique",
  "avg",
  "std",
  "q25",
  "q50",
  "q75",
  "count",
  "null_percentage",
];
*/

export async function fetchParquetSchema(
  db: AsyncDuckDB,
  path: string
): Promise<Record<string, unknown>[]> {
  // const _path =
  //   "https://shell.duckdb.org/data/tpch/0_01/parquet/orders.parquet";
  console.log(`duckdb: fetch parquet schema: ${path}`);

  const _path = path;
  const query = `
SELECT * FROM parquet_schema('${_path}');
  `;

  return executeQuery(db, query);
}

export async function fetchValues(
  db: AsyncDuckDB,
  path: string,
  fieldName: string,
  value?: string
): Promise<unknown[]> {
  // const _path =
  //   "https://shell.duckdb.org/data/tpch/0_01/parquet/orders.parquet";
  const _path = path;
  const where = value ? ` WHERE ${fieldName} like '%${value}%'` : ``;
  const query = `
SELECT distinct ${fieldName} FROM read_parquet('${_path}') ${where};
  `;

  const rows = await executeQuery(db, query);
  return rows.map((row) => {
    return row[`${fieldName}`];
  });
}

export async function countPopulation({
  db,
  path,
  where,
  idFieldName,
  distinct,
}: {
  db: AsyncDuckDB;
  path: string;
  where?: string;
  idFieldName?: string;
  distinct?: boolean;
}): Promise<string> {
  const distinctClause = distinct || false ? "DISTINCT" : "";
  const columnClause = idFieldName || "*";
  const selectClause = `COUNT(${distinctClause} ${columnClause}) as popoulation`;
  const whereClause = where ? `WHERE ${where}` : "";
  const query = `
SELECT ${selectClause} FROM read_parquet('${path}') ${whereClause};
  `;

  const rows = await executeQuery(db, query);
  return String(rows[0]?.popoulation);
}
