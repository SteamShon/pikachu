// async/await
import type { CubeHistory, Prisma, Provider } from "@prisma/client";
import type S3 from "aws-sdk/clients/s3";
import type { NextApiRequest, NextApiResponse } from "next";
import { pipeline } from "node:stream/promises";
import pg from "pg";
import { from as copyFrom } from "pg-copy-streams";

function partitionBucketPrefix(path: string) {
  const tokens = path.replace("s3://", "").split("/");
  const bucket = tokens.shift();

  return { bucket, prefix: tokens.join("/") };
}
function extractValue({
  object,
  paths,
}: {
  object?: Prisma.JsonValue;
  paths: string[];
}) {
  return paths.reduce((prev, path) => {
    const isObject = prev && typeof prev === "object" && !Array.isArray(prev);

    if (isObject) {
      return (prev as Prisma.JsonObject)?.[path];
    } else return undefined;
  }, object);
}
async function upload({
  databaseUrl,
  s3,
  s3Path,
  cubeHistoryId,
}: {
  databaseUrl: string;
  s3: S3;
  s3Path: string;
  cubeHistoryId: string;
}) {
  let result = false;
  const partition = `UserFeature_${cubeHistoryId}`;
  const { bucket, prefix } = partitionBucketPrefix(s3Path);
  if (!bucket) return Promise.resolve(false);

  console.log("uploading");
  console.log(partition);
  console.log(bucket);
  console.log(prefix);

  const client = new pg.Client(databaseUrl);
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
    const sourceStream = s3
      .getObject({
        Bucket: bucket,
        Key: prefix,
      })
      .createReadStream();
    await pipeline(sourceStream, ingestStream);
    result = true;
  } catch (error) {
    console.log(error);
    result = false;
  } finally {
    client.end();
  }
  return result;
}

async function cleanup({
  databaseUrl,
  cubeId,
  limit,
}: {
  databaseUrl: string;

  cubeId: string;
  limit: number;
}) {
  let result = false;
  console.log("cleanup");
  const cubeHistoriesToDelete: CubeHistory[] = [];
  const client = new pg.Client(databaseUrl);
  await client.connect();
  try {
    // create new version
    // create partition
    const r = await client.query<CubeHistory>(
      `SELECT * FROM "CubeHistory" WHERE "cubeId" = '${cubeId}' ORDER BY version DESC`
    );

    r.rows.forEach((cubeHistory, index) => {
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
    result = true;
    // // delete s3 file
    // cubeHistoriesToDelete.forEach((cubeHistory) => {
    //   const { bucket, prefix } = partitionBucketPrefix(
    //     toOutputPath(cubeHistory.id)
    //   );
    //   if (bucket) {
    //     s3.deleteObject({ Bucket: bucket, Key: prefix }, () => {
    //       console.log(
    //         `delete s3 file success: ${toOutputPath(cubeHistory.id)}`
    //       );
    //     });
    //   }
    // });
  } catch (error) {
    result = false;
    console.log(error);
  } finally {
    client.end();
  }
  return result;
}

async function executeQuery({
  databaseUrl,
  query,
}: {
  databaseUrl: string;
  query: string;
}) {
  const client = new pg.Client(databaseUrl);

  try {
    await client.connect();
    const result = await client.query(query);
    console.log(result);
    return result;
  } finally {
    client.end();
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const config = req.body as Record<string, unknown>;
  const provider = config["provider"] as Provider | undefined;
  const method = config["method"] as string | undefined;
  const payload = config["payload"] as Record<string, unknown> | undefined;
  const databaseUrl = extractValue({
    object: provider?.details,
    paths: ["DATABASE_URL"],
  }) as string | undefined;
  const query = payload?.sql as string | undefined;

  console.log(config);
  if (!provider || !method || !databaseUrl || !query) {
    res.status(404);
  } else {
    try {
      if (method === "executeQuery") {
        const result = await executeQuery({ databaseUrl, query });
        res.json(result);
      }

      res.status(200);
    } catch (error) {
      console.log(error);

      res.status(500).send({
        message: (error as Error).message,
      });
    }

    //const result = await upload(serviceConfig, cubeHistory);
    //if (result) res.status(200).end();
    //else res.status(500).end();
  }
  res.end();
};

export default handler;
