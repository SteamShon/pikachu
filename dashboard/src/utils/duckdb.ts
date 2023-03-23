import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import * as duckdb from "@duckdb/duckdb-wasm";
import type { ServiceConfig } from "@prisma/client";
import { MyCache } from "./cache";
import {
  extractS3AccessKeyId,
  extractS3Region,
  extractS3SecretAccessKey,
} from "./serviceConfig";

const pool = new MyCache<ServiceConfig, AsyncDuckDB | undefined>({
  max: 3, // # of items
  ttl: 10 * 60 * 1000, // expiration in ms (10 min)
});
const queryCache = new MyCache<
  { serviceConfig: ServiceConfig; query: string },
  Record<string, unknown>[]
>({
  max: 50, // # of items
  ttl: 10 * 60 * 1000, // expiration in ms (10 min)
});

async function loadDuckDBInner(
  serviceConfig: ServiceConfig
): Promise<AsyncDuckDB | undefined> {
  const allBundles = duckdb.getJsDelivrBundles();
  const bestBundle = await duckdb.selectBundle(allBundles);

  console.log(bestBundle);
  console.log(serviceConfig);

  if (!bestBundle.mainWorker) {
    console.error("can't initialize workder");
    return Promise.resolve(undefined);
  }

  const worker = await duckdb.createWorker(bestBundle.mainWorker);
  // Instantiate the asynchronus version of DuckDB-wasm
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bestBundle.mainModule, bestBundle.pthreadWorker);

  const s3Region = extractS3Region(serviceConfig);
  const s3AccessKeyId = extractS3AccessKeyId(serviceConfig);
  const s3SecretAccessKey = extractS3SecretAccessKey(serviceConfig);
  // set s3 config.
  const setQuery = `
SET home_directory='/tmp/';
SET s3_region='${s3Region}';
SET s3_access_key_id='${s3AccessKeyId}';
SET s3_secret_access_key='${s3SecretAccessKey}';
  `;

  const conn = await db.connect();
  await conn.query(setQuery);
  console.log("duckdb: load db instance success.");

  return db;
}
export async function loadDuckDB(
  serviceConfig: ServiceConfig
): Promise<AsyncDuckDB | undefined> {
  return pool.get(serviceConfig, loadDuckDBInner);
}

async function executeQueryInner({
  serviceConfig,
  query,
}: {
  serviceConfig: ServiceConfig;
  query: string;
}): Promise<Record<string, unknown>[]> {
  console.log(`duckdb: ${query}`);
  const db = await loadDuckDB(serviceConfig);
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
  serviceConfig: ServiceConfig,
  query: string
): Promise<Record<string, unknown>[]> {
  return queryCache.get({ serviceConfig, query }, executeQueryInner);
}
export async function fetchParquetSchema(
  serviceConfig: ServiceConfig,
  path: string
): Promise<Record<string, unknown>[]> {
  const query = `
SELECT * FROM parquet_schema('${path}');
  `;

  return executeQuery(serviceConfig, query);
}

export async function fetchValues(
  serviceConfig: ServiceConfig,
  sql: string,
  fieldName: string,
  value?: string
): Promise<unknown[]> {
  const where = value ? ` WHERE ${fieldName} like '%${value}%'` : ``;
  const query = `
SELECT distinct ${fieldName} FROM (${sql}) ${where};
  `;

  const rows = await executeQuery(serviceConfig, query);
  return rows.map((row) => {
    return row[`${fieldName}`];
  });
}

export async function countPopulation({
  serviceConfig,
  sql,
  where,
  idFieldName,
  distinct,
}: {
  serviceConfig: ServiceConfig;
  sql: string;
  where?: string;
  idFieldName?: string;
  distinct?: boolean;
}): Promise<string> {
  const distinctClause = distinct || false ? "DISTINCT" : "";
  const columnClause = idFieldName || "*";
  const selectClause = `COUNT(${distinctClause} ${columnClause}) as popoulation`;
  const whereClause = where ? `WHERE ${where}` : "";
  const query = `
SELECT ${selectClause} FROM (${sql}) ${whereClause};
  `;

  const rows = await executeQuery(serviceConfig, query);
  return String(rows[0]?.popoulation);
}
