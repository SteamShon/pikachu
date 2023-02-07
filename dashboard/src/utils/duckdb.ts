import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import * as duckdb from "@duckdb/duckdb-wasm";

export async function loadDuckDB(): Promise<AsyncDuckDB> {
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

  // Select a bundle based on browser checks
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: "text/javascript",
    })
  );

  // Instantiate the asynchronus version of DuckDB-wasm
  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);
  return db;
}

export async function executeQuery(
  db: AsyncDuckDB,
  query: string
): Promise<Record<string, unknown>[]> {
  const conn = await db.connect();

  await conn.query(
    `SET home_directory="/home/shon/workspace/pikachu/dashboard"`
  );

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
// export const ParquetMetadataColumns = [
//   "column_name",
//   "column_type",
//   "min",
//   "max",
//   "approx_unique",
//   "avg",
//   "std",
//   "q25",
//   "q50",
//   "q75",
//   "count",
//   "null_percentage",
// ];

export type S3Config = {
  s3_region: string;
  s3_access_key_id: string;
  s3_secret_access_key: string;
};
export async function fetchMetadata(
  db: AsyncDuckDB,
  path: string,
  s3Config: S3Config
): Promise<Record<string, unknown>[]> {
  // const _path =
  //   "https://shell.duckdb.org/data/tpch/0_01/parquet/orders.parquet";
  const _path = path;
  const setCommands = Object.entries(s3Config).map(([key, value]) => {
    `${key}='${value}'`;
  });
  const setCommand = setCommands.join(";");
  const query = `
    ${setCommand}

    SELECT * FROM parquet_metadata('${_path}');
  `;
  console.log(query);
  return executeQuery(db, query);
}
