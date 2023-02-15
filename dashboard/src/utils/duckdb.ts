import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import * as duckdb from "@duckdb/duckdb-wasm";
import type { CubeConfig } from "@prisma/client";
import { MyCache } from "./cache";

const pool = new MyCache<CubeConfig, AsyncDuckDB | undefined>({
  max: 3, // # of items
  ttl: 10 * 60 * 1000, // expiration in ms (10 min)
});
const queryCache = new MyCache<
  { cubeConfig: CubeConfig; query: string },
  Record<string, unknown>[]
>({
  max: 50, // # of items
  ttl: 10 * 60 * 1000, // expiration in ms (10 min)
});

async function loadDuckDBInner(
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

  const conn = await db.connect();
  await conn.query(setQuery);
  console.log("duckdb: load db instance success.");

  return db;
}
export async function loadDuckDB(
  cubeConfig: CubeConfig
): Promise<AsyncDuckDB | undefined> {
  return pool.get(cubeConfig, loadDuckDBInner);
}

async function executeQueryInner({
  cubeConfig,
  query,
}: {
  cubeConfig: CubeConfig;
  query: string;
}): Promise<Record<string, unknown>[]> {
  console.log(`duckdb: ${query}`);
  const db = await loadDuckDB(cubeConfig);
  if (!db) return Promise.reject(new Error("duckdb instance is not loaded."));

  const conn = await db.connect();
  const result = await conn.query(query);
  const buffer: Record<string, unknown>[] = [];
  (result?.batches || []).forEach((rows) => {
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
  });
  return buffer;
}

export async function executeQuery(
  cubeConfig: CubeConfig,
  query: string
): Promise<Record<string, unknown>[]> {
  return queryCache.get({ cubeConfig, query }, executeQueryInner);
}
export async function fetchParquetSchema(
  cubeConfig: CubeConfig,
  path: string
): Promise<Record<string, unknown>[]> {
  // const _path =
  //   "https://shell.duckdb.org/data/tpch/0_01/parquet/orders.parquet";
  const _path = path;
  const query = `
SELECT * FROM parquet_schema('${_path}');
  `;

  return executeQuery(cubeConfig, query);
}

export async function fetchValues(
  cubeConfig: CubeConfig,
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

  const rows = await executeQuery(cubeConfig, query);
  return rows.map((row) => {
    return row[`${fieldName}`];
  });
}

export async function countPopulation({
  cubeConfig,
  path,
  where,
  idFieldName,
  distinct,
}: {
  cubeConfig: CubeConfig;
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

  const rows = await executeQuery(cubeConfig, query);
  return String(rows[0]?.popoulation);
}
