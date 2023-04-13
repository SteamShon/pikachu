// async/await
import type {
  Cube,
  CubeHistory,
  ServiceConfig,
  UserFeature,
} from "@prisma/client";
import { Database } from "duckdb-async";
import type { NextApiRequest, NextApiResponse } from "next";
import { pipeline } from "node:stream/promises";
import pg from "pg";
import { from as copyFrom } from "pg-copy-streams";
import { env } from "../../../env/server.mjs";
import { loadS3, partitionBucketPrefix } from "../../../utils/aws";
import {
  extractS3AccessKeyId,
  extractS3Region,
  extractS3SecretAccessKey,
} from "../../../utils/serviceConfig";

function withConfiguration(serviceConfig: ServiceConfig, sql?: string) {
  const s3Region = extractS3Region(serviceConfig);
  const s3AccessKeyId = extractS3AccessKeyId(serviceConfig);
  const s3SecretAccessKey = extractS3SecretAccessKey(serviceConfig);
  const newSql = sql || "";

  return `
  INSTALL httpfs;
  LOAD httpfs;
  INSTALL json;
  LOAD json;

  SET s3_region='${s3Region}';
  SET s3_access_key_id='${s3AccessKeyId}';
  SET s3_secret_access_key='${s3SecretAccessKey}';

  ${newSql}
  `;
}
async function getDuckDB() {
  return await Database.create(":memory:");
}

async function getColumns(serviceConfig: ServiceConfig, cube: Cube) {
  const db = await getDuckDB();

  // describe
  const describeSql = withConfiguration(serviceConfig, `DESCRIBE ${cube.sql}`);
  const rows = await db.all(describeSql);

  return rows.map((row) => row.column_name as string);
}
function toOutputPath(cubeHistoryId: string) {
  return `s3://pikachu-dev/dashboard/user-feature/${cubeHistoryId}.csv`;
}

async function transform(
  serviceConfig: ServiceConfig,
  cube: Cube,
  cubeHistory: CubeHistory
) {
  const columns = await getColumns(serviceConfig, cube);
  const db = await getDuckDB();
  const outputPath = toOutputPath(cubeHistory.id);
  const transformSql = withConfiguration(
    serviceConfig,
    `
        DROP TABLE IF EXISTS download;
        CREATE TABLE download AS (
            SELECT  '${cubeHistory.id}' AS cubeHistoryId,
                    userId,
                    to_json((${columns.join(",")})) AS feature
            FROM    (${cube.sql})
        );
        COPY (SELECT * FROM download) TO '${outputPath}' (HEADER, DELIMITER ',');
      `
  );
  console.log(transformSql);
  const rows = await db.all(transformSql);
  return rows;
}
async function upload(serviceConfig: ServiceConfig, cubeHistory: CubeHistory) {
  let result = false;
  const cubeHistoryId = cubeHistory.id;
  const partition = `UserFeature_${cubeHistoryId}`;

  console.log("uploading");
  console.log(partition);

  const client = new pg.Client(env.DATABASE_URL);
  await client.connect();
  try {
    // create new version
    // create partition
    await client.query(
      `CREATE TABLE IF NOT EXISTS "${partition}" PARTITION OF "UserFeature" FOR VALUES IN ('${cubeHistoryId}')`
    );

    const ingestStream = client.query(
      copyFrom(`COPY "${partition}" FROM STDIN CSV HEADER DELIMITER ','`)
    );
    const s3 = loadS3(serviceConfig);
    const sourceStream = s3
      .getObject({
        Bucket: "pikachu-dev",
        Key: `dashboard/user-feature/${cubeHistoryId}.csv`,
      })
      .createReadStream();
    await pipeline(sourceStream, ingestStream);
    result = true;
  } finally {
    client.end();
  }
  return result;
}

async function cleanup(
  serviceConfig: ServiceConfig,
  cube: Cube,
  limit: number
) {
  console.log("cleanup");
  const cubeHistoriesToDelete: CubeHistory[] = [];
  const client = new pg.Client(env.DATABASE_URL);
  await client.connect();
  try {
    // create new version
    // create partition
    const result = await client.query<CubeHistory>(
      `SELECT * FROM "CubeHistory" WHERE "cubeId" = '${cube.id}' ORDER BY version DESC`
    );

    result.rows.forEach((cubeHistory, index) => {
      if (index >= limit) {
        cubeHistoriesToDelete.push(cubeHistory);
      }
    });
    const dropPartitionSql = cubeHistoriesToDelete
      .map((cubeHistory) => {
        return `DROP TABLE IF EXISTS "UserFeature_${cubeHistory.id}"`;
      })
      .join(";");
    console.log(dropPartitionSql);
    await client.query(dropPartitionSql);
    const ids = cubeHistoriesToDelete
      .map((cubeHistory) => `'${cubeHistory.id}'`)
      .join(",");
    const deleteCubeHistorySql = `DELETE FROM "CubeHistory" WHERE id in (${ids})`;
    console.log(deleteCubeHistorySql);
    await client.query(deleteCubeHistorySql);
    // delete s3 file
    const s3 = loadS3(serviceConfig);

    cubeHistoriesToDelete.forEach((cubeHistory) => {
      const { bucket, prefix } = partitionBucketPrefix(
        toOutputPath(cubeHistory.id)
      );
      if (bucket) {
        s3.deleteObject({ Bucket: bucket, Key: prefix }, () => {
          console.log(
            `delete s3 file success: ${toOutputPath(cubeHistory.id)}`
          );
        });
      }
    });
  } finally {
    client.end();
  }
}

async function select(cubeHistory: CubeHistory) {
  const client = new pg.Client(env.DATABASE_URL);
  await client.connect();
  try {
    // create new version
    // create partition
    return await client.query<UserFeature>(
      `SELECT * FROM "UserFeature_${cubeHistory.id}" limit 10`
    );
  } finally {
    client.end();
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const config = req.body as Record<string, unknown>;
  const serviceConfig = config["serviceConfig"] as ServiceConfig | undefined;
  const cube = config["cube"] as Cube | undefined;
  const cubeHistory = config["cubeHistory"] as CubeHistory | undefined;
  const step = config["step"] as string | undefined;

  if (!serviceConfig || !cubeHistory || !cube || !step) {
    res.status(404).end();
  } else {
    try {
      if (step === "transform") {
        await transform(serviceConfig, cube, cubeHistory);
      } else if (step === "upload") {
        await upload(serviceConfig, cubeHistory);
      } else if (step === "cleanup") {
        await cleanup(serviceConfig, cube, 1);
      } else if (step === "select") {
        const result = await select(cubeHistory);
        res.json(result.rows);
      } else {
        await transform(serviceConfig, cube, cubeHistory);
        await upload(serviceConfig, cubeHistory);
        await cleanup(serviceConfig, cube, 1);
      }

      res.status(200).end();
    } catch (error) {
      res.status(500).end();
    }

    //const result = await upload(serviceConfig, cubeHistory);
    //if (result) res.status(200).end();
    //else res.status(500).end();
  }
};

export default handler;
