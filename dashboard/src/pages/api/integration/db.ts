// async/await
import type { Prisma, Integration } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { pipeline } from "node:stream/promises";
import pg from "pg";
import { from as copyFrom } from "pg-copy-streams";
import { extractConfigs } from "../../../utils/awsS3DuckDB";

async function checkConnection(databaseUrl: string) {
  const client = new pg.Client(databaseUrl);

  try {
    await client.connect();
    return true;
  } catch (e) {
    console.log(e);
    return false;
  } finally {
    client.end();
  }
}

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

function toOutputPath(cubeHistoryId: string) {
  return `s3://pikachu-dev/dashboard/user-feature/${cubeHistoryId}.csv`;
}
async function uploadAll({
  cubeHistoryId,
  databaseUrl,
  cubeProviderDetails,
}: {
  databaseUrl: string;
  cubeProviderDetails?: Prisma.JsonValue | null;
  cubeHistoryId: string;
}) {
  try {
    const sql = `
    CREATE TABLE IF NOT EXISTS "UserFeature_${cubeHistoryId}" PARTITION OF "UserFeature" FOR VALUES IN ('${cubeHistoryId}')
    `;
    await executeQuery({ databaseUrl, query: sql });
    return await upload({
      cubeProviderDetails: cubeProviderDetails,
      databaseUrl,
      cubeHistoryId,
    });
  } catch (error) {
    console.log(error);
  }
}
async function upload({
  cubeProviderDetails,
  databaseUrl,
  cubeHistoryId,
}: {
  databaseUrl: string;
  cubeProviderDetails?: Prisma.JsonValue | null;
  cubeHistoryId: string;
}) {
  let result = false;
  console.log("uploading");
  const configs = extractConfigs(cubeProviderDetails);
  const client = new pg.Client(databaseUrl);
  if (!configs) return false;

  try {
    const { s3 } = configs;
    await client.connect();

    const ingestStream = client.query(
      copyFrom(
        `COPY "UserFeature_${cubeHistoryId}" FROM STDIN CSV HEADER DELIMITER ','`
      )
    );
    const outputPath = toOutputPath(cubeHistoryId);
    const { bucket, prefix } = partitionBucketPrefix(outputPath);
    console.log(bucket);
    console.log(prefix);
    if (!bucket) {
      return new Error(`bucket is not found: ${outputPath}`);
    }

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
  const details = config["details"] as Prisma.JsonValue | undefined;
  const method = config["method"] as string | undefined;
  const payload = config["payload"] as Record<string, unknown> | undefined;
  const databaseUrl = extractValue({
    object: details,
    paths: ["DATABASE_URL"],
  }) as string | undefined;

  if (!method || !databaseUrl) {
    res.status(404);
  } else {
    try {
      if (method === "checkConnection") {
        const valid = await checkConnection(databaseUrl);
        res.json(valid);
      } else if (method === "executeQuery") {
        const query = payload?.sql as string | undefined;
        if (details && query) {
          const result = await executeQuery({ databaseUrl, query });
          res.json(result);
        }
      } else if (method === "createPartition") {
        const cubeHistoryId = payload?.cubeHistoryId as string | undefined;
        if (cubeHistoryId) {
          const sql = `CREATE TABLE IF NOT EXISTS "UserFeature_${cubeHistoryId}" PARTITION OF "UserFeature" FOR VALUES IN ('${cubeHistoryId}')`;
          const result = await executeQuery({ databaseUrl, query: sql });
          res.json(result);
        }
      } else if (method === "upload") {
        const cubeHistoryId = payload?.cubeHistoryId as string | undefined;

        if (details && cubeHistoryId) {
          const result = await uploadAll({
            cubeHistoryId,
            databaseUrl,
            cubeProviderDetails: details,
          });
          res.json(result);
        }
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
