// Client side
import type { Prisma } from "@prisma/client";
import { extractValue } from "./json";
import S3 from "aws-sdk/clients/s3";
import type { Buckets, Object as S3Object } from "aws-sdk/clients/s3";
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import * as duckdb from "@duckdb/duckdb-wasm";
import { MyCache } from "./cache";
import type { RuleGroupType } from "@react-querybuilder/ts";
import { formatQuery } from "react-querybuilder";
import type { DatasetSchemaType } from "../components/schema/dataset";

export function extractS3Region(details?: Prisma.JsonValue | null) {
  if (!details) return undefined;

  return extractValue({
    object: details,
    paths: ["region"],
  }) as string | undefined;
}

export function extractS3AccessKeyId(details?: Prisma.JsonValue | null) {
  if (!details) return undefined;

  return extractValue({
    object: details,
    paths: ["aws_access_key_id"],
  }) as string | undefined;
}

export function extractS3SecretAccessKey(details?: Prisma.JsonValue | null) {
  if (!details) return undefined;

  return extractValue({
    object: details,
    paths: ["aws_secret_access_key"],
  }) as string | undefined;
}

export function extractS3Buckets(details?: Prisma.JsonValue | null) {
  if (!details) return undefined;

  return extractValue({
    object: details,
    paths: ["buckets"],
  }) as string[] | undefined;
}

export function extractBuilderPrivateKey(details?: Prisma.JsonValue | null) {
  if (!details) return undefined;

  return extractValue({
    object: details,
    paths: ["privateKey"],
  }) as string | undefined;
}

export function extractBuilderPublicKey(details?: Prisma.JsonValue | null) {
  if (!details) return undefined;

  return extractValue({
    object: details,
    paths: ["publicKey"],
  }) as string | undefined;
}

export function extractConfigs(jsonObject?: Prisma.JsonValue | null) {
  if (!jsonObject) return undefined;
  const details = jsonObject as Prisma.JsonObject;

  const s3 = loadS3(details);
  const accessKeyId = extractS3AccessKeyId(details);
  const secretAccessKey = extractS3SecretAccessKey(details);
  const region = extractS3Region(details);
  const buckets = extractS3Buckets(details);

  if (!s3 || !accessKeyId || !secretAccessKey || !region || !buckets)
    return undefined;
  return { s3, accessKeyId, secretAccessKey, region, buckets };
}
export type TreeNode = {
  name: string;
  path: string;
  children: TreeNode[];
};
export function prependS3ConfigsOnQuery({
  details,
  query,
}: {
  details?: Prisma.JsonValue | null;
  query: string;
}) {
  if (!details) return undefined;

  const configs = extractConfigs(details);
  if (!configs) return undefined;
  const { region, accessKeyId, secretAccessKey } = configs;

  return `
  INSTALL httpfs;
  LOAD httpfs;
  INSTALL json;
  LOAD json;

  SET s3_region='${region}';
  SET s3_access_key_id='${accessKeyId}';
  SET s3_secret_access_key='${secretAccessKey}';

  ${query}
  `;
}
export function loadS3(details?: Prisma.JsonValue | null): S3 | undefined {
  if (!details) return undefined;

  const s3Region = extractS3Region(details);
  const s3AccessKeyId = extractS3AccessKeyId(details);
  const s3SecretAccessKey = extractS3SecretAccessKey(details);

  if (!s3Region || !s3AccessKeyId || !s3SecretAccessKey) return undefined;

  return new S3({
    region: s3Region,
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
    signatureVersion: "v4",
  });
}
export function buildPath(
  nodes: TreeNode[],
  paths: TreeNode[],
  targetNodeName: string
): TreeNode[] {
  const found = nodes.find((n) => n.name === targetNodeName);

  if (found) {
    return [...paths, found];
  }

  let subPaths: TreeNode[] = [];
  nodes.forEach((node) => {
    node.children.forEach((child) => {
      subPaths = buildPath([child], [...paths, node], targetNodeName);
      if (subPaths.length > 0) return subPaths;
    });
  });

  return subPaths;
}

export function objectsToTree({ paths }: { paths: S3Object[] }) {
  return paths.reduce((prev: TreeNode[], p) => {
    const names = p.Key?.split("/") || [];

    names.reduce((q, name) => {
      if (name === "") return q;

      let temp = q.find((o) => o.name === name);
      if (!temp) {
        q.push((temp = { name, path: p.Key || "", children: [] }));
      }

      return temp.children;
    }, prev);

    return prev;
  }, []);
}
export async function listBuckets({
  s3,
}: {
  s3: S3;
}): Promise<Buckets | undefined> {
  const buckets = await s3.listBuckets().promise();
  return buckets.Buckets;
}
export async function listFoldersRecursively({
  s3,
  bucketName,
  prefix = "",
}: {
  s3: S3;
  bucketName: string;
  prefix?: string;
}) {
  let continuationToken: string | undefined;
  const folders: S3Object[] = [];

  const response = await s3
    .listObjectsV2({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })
    .promise();
  for (const item of response?.Contents || []) {
    if (item.Key && item.Key !== prefix) {
      folders.push(item);

      // folders.push(
      //   ...(await listFoldersRecursively({
      //     s3,
      //     bucketName,
      //     prefix: item.Key,
      //   }))
      // );
    }
  }

  // do {

  //   continuationToken = response?.NextContinuationToken;
  // } while (continuationToken);

  return folders;
}

export function partitionBucketPrefix(path: string) {
  const tokens = path.replace("s3://", "").split("/");
  const bucket = tokens.shift();

  return { bucket, prefix: tokens.join("/") };
}

const pool = new MyCache<Prisma.JsonValue, AsyncDuckDB | undefined>({
  max: 3, // # of items
  ttl: 10 * 60 * 1000, // expiration in ms (10 min)
});
const queryCache = new MyCache<
  { details: Prisma.JsonValue; query: string },
  Record<string, unknown>[]
>({
  max: 50, // # of items
  ttl: 10 * 60 * 1000, // expiration in ms (10 min)
});

async function loadDuckDBInner(
  details?: Prisma.JsonValue | null
): Promise<AsyncDuckDB | undefined> {
  const allBundles = duckdb.getJsDelivrBundles();
  const bestBundle = await duckdb.selectBundle(allBundles);

  if (!bestBundle.mainWorker) {
    console.error("can't initialize workder");
    return Promise.resolve(undefined);
  }

  const worker = await duckdb.createWorker(bestBundle.mainWorker);
  // Instantiate the asynchronus version of DuckDB-wasm
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bestBundle.mainModule, bestBundle.pthreadWorker);

  const s3Region = extractS3Region(details);
  const s3AccessKeyId = extractS3AccessKeyId(details);
  const s3SecretAccessKey = extractS3SecretAccessKey(details);
  // set s3 config.
  const setQuery = `
SET home_directory='~/';
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
  details?: Prisma.JsonValue | null
): Promise<AsyncDuckDB | undefined> {
  if (!details) return Promise.resolve(undefined);

  return pool.get(details, loadDuckDBInner);
}

async function executeQueryInner({
  details,
  query,
}: {
  details?: Prisma.JsonValue | null;
  query: string;
}): Promise<Record<string, unknown>[]> {
  const startedAt = new Date().getTime();
  const duckdb = await loadDuckDB(details);
  if (!duckdb)
    return Promise.reject(new Error("duckdb instance is not loaded."));

  const conn = await duckdb.connect();
  const result = await conn.query(query);
  const duration = new Date().getTime() - startedAt;

  console.log(`duckdb[${duration}]: ${query}`);

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

export async function executeQuery({
  query,
  details,
}: {
  details?: Prisma.JsonValue | null;
  query: string;
}): Promise<Record<string, unknown>[]> {
  if (!details) return Promise.resolve([]);

  return queryCache.get(
    { details: details as Prisma.JsonObject, query },
    executeQueryInner
  );
}
export async function describe({
  cubeSql,
  details,
}: {
  details?: Prisma.JsonValue | null;
  cubeSql: string;
}): Promise<Record<string, unknown>[]> {
  const query = `DESCRIBE ${cubeSql}`;

  return executeQuery({ details, query });
}
export async function fetchParquetSchema({
  details,
  path,
}: {
  details?: Prisma.JsonValue | null;
  path: string;
}): Promise<Record<string, unknown>[]> {
  const query = `
SELECT * FROM parquet_schema('${path}');
  `;

  return executeQuery({ details, query });
}

export async function fetchValues({
  sql,
  fieldName,
  columnType,
  value,
  details,
}: {
  details?: Prisma.JsonValue | null;
  sql: string;
  fieldName: string;
  columnType: string;
  value?: string;
}): Promise<unknown[]> {
  const column = columnType.endsWith("[]")
    ? `unnest(${fieldName}) AS ${fieldName}`
    : `${fieldName}`;
  const where = value ? ` WHERE ${fieldName} like '%${value}%'` : ``;
  const query = `
SELECT distinct ${column} FROM (${sql}) ${where};
  `;
  console.log(query);
  const rows = await executeQuery({ details, query });
  return rows.map((row) => {
    return row[`${fieldName}`];
  });
}

export async function countPopulation({
  details,
  sql,
  where,
  idFieldName,
  distinct,
}: {
  details?: Prisma.JsonValue | null;
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
  console.log(query);
  const rows = await executeQuery({ details, query });
  return String(rows[0]?.popoulation);
}

export function formatQueryCustom(
  metadata: Record<string, unknown>[],
  query: RuleGroupType
) {
  const jsonLogicToSql = (
    node: Record<string, unknown>
  ): string | undefined => {
    if (node.or) {
      const childrens = node.or as Record<string, unknown>[];
      return childrens
        .map((child) => {
          return `(${jsonLogicToSql(child)})`;
        })
        .join(" OR ");
    }
    if (node.and) {
      const childrens = node.and as Record<string, unknown>[];
      return childrens
        .map((child) => {
          return `(${jsonLogicToSql(child)})`;
        })
        .join(" AND ");
    }
    if (node.in) {
      const kvs = node.in as unknown[];
      const key = (kvs[0] as { var: string }).var;
      const meta = metadata.find((meta) => meta.column_name === key)
        ?.column_type as string;
      const isArray = meta.endsWith("[]");
      const values = kvs[1] as string[];
      // check if key is list type.
      const ls = values.map((value) => {
        return isArray
          ? `array_contains(${key}, '${value}')`
          : `${key} = '${value}'`;
      });
      return ls.join(" OR ");
    }

    return undefined;
  };

  const jsonLogic = formatQuery(query, "jsonlogic");
  return jsonLogicToSql(jsonLogic as Record<string, unknown>);
}

export async function listFiles(details?: Prisma.JsonValue | null) {
  const query = `
  .files;
  `;
  return await executeQuery({ details, query });
}

export function buildJoinSql({
  details,
  dataset,
}: {
  details?: Prisma.JsonValue | null;
  dataset: DatasetSchemaType;
}) {
  const targets = dataset.tables.map((target, index) => {
    const read = target.files.map((file) => `'${file}'`).join(",");
    const conditions = target.conditions.map(
      ({ sourceTable, sourceColumn, targetColumn }) => {
        return `t_${sourceTable}.${sourceColumn} = t_${index}.${targetColumn}`;
      }
    );
    const conditionsClause =
      conditions.length === 0 ? "" : `ON (${conditions.join(" AND ")})`;
    return `read_parquet([${read}]) AS t_${index} ${conditionsClause}`;
  });
  const from = targets.join(" JOIN ");
  return `
SELECT  *
FROM    ${from}
    `;
}

export function fromSql(sql?: string): DatasetSchemaType | undefined {
  if (!sql) return undefined;

  const matches = sql.matchAll(/read_parquet(.*?)AS(.*?)(JOIN|\n)/gm);
  const datasets = [];

  for (const match of matches) {
    const files = (
      match[1]?.replace(/\[|\]|\(|\)|'/g, "")?.split(",") || []
    ).map((file) => file.trim());
    const conditions = [];
    for (const condition of match[2]?.matchAll(/\((.*)\.(.*)=(.*)\.(.*)\)/gm) ||
      []) {
      const tokens = condition[1]?.split("_");
      const sourceTable = tokens?.[tokens.length - 1];
      if (sourceTable && condition[2] && condition[4]) {
        conditions.push({
          sourceTable,
          sourceColumn: condition[2],
          targetColumn: condition[4],
        });
      }
    }
    datasets.push({ files, conditions });
  }

  return { tables: datasets };
}

function toOutputPath(integrationId: string, version: string) {
  return `s3://pikachu-dev/dashboard/user-feature/${integrationId}/${version}.csv`;
}
function toVersion(integrationId: string, version: string) {
  return `${integrationId}_${version}`;
}
export async function getColumns({
  details,
  cubeSql,
}: {
  details?: Prisma.JsonValue | null;
  cubeSql: string;
}) {
  const query = `DESCRIBE ${cubeSql}`;

  const rows = await executeQuery({ details, query });
  return rows.map((row) => row.column_name as string);
}
export async function generateTransformCubeSql({
  cubeProviderDetails,
  cubeIntegrationDetails: cubeIntegrationDetails,
  integrationId,
  version,
}: {
  cubeProviderDetails?: Prisma.JsonValue | null;
  cubeIntegrationDetails?: Prisma.JsonValue | null;
  integrationId: string;
  version: string;
}) {
  const cubeSql = extractValue({
    object: cubeIntegrationDetails,
    paths: ["SQL"],
  }) as string | undefined;

  if (!cubeProviderDetails || !cubeIntegrationDetails || !cubeSql) return;

  const columns = await getColumns({ details: cubeProviderDetails, cubeSql });
  const outputPath = toOutputPath(integrationId, version);

  const transformSql = prependS3ConfigsOnQuery({
    details: cubeProviderDetails,
    query: `
    DROP TABLE IF EXISTS download;
    CREATE TABLE download AS (
        SELECT  '${toVersion(integrationId, version)}' AS version,
                userId,
                to_json((${columns.join(",")})) AS feature
        FROM    (${cubeSql})
    );
    COPY (SELECT * FROM download) TO '${outputPath}' (HEADER, DELIMITER ',');
    `,
  });

  return transformSql;
}
export function extractParams(rawSql?: string) {
  const params = [];
  if (!rawSql) return [];

  for (const param of rawSql.matchAll(/{.*}/gm)) {
    params.push(param[0]);
  }
  return params;
}
