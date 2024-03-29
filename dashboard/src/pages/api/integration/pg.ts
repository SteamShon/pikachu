// async/await
import type { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { pipeline } from "node:stream/promises";
import pg from "pg";
import { from as copyFrom } from "pg-copy-streams";
import { extractConfigs } from "../../../utils/awsS3DuckDB";
import { executeQuery } from "../../../utils/pg";

async function checkConnection(databaseUrl: string) {
  return await executeQuery({ databaseUrl, query: "SELECT 1" });
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

function toOutputPath(integrationId: string, version: string) {
  return `s3://pikachu-dev/dashboard/user-feature/${integrationId}/${version}.csv`;
}
function toVersion(integrationId: string, version: string) {
  return `${integrationId}_${version}`;
}

async function uploadAll({
  integrationId,
  version,
  databaseUrl,
  cubeProviderDetails,
}: {
  integrationId: string;
  version: string;
  databaseUrl: string;
  cubeProviderDetails?: Prisma.JsonValue | null;
}) {
  try {
    const sql = `
    CREATE TABLE IF NOT EXISTS "UserFeature_${toVersion(
      integrationId,
      version
    )}" PARTITION OF "UserFeature" FOR VALUES IN ('${toVersion(
      integrationId,
      version
    )}')
    `;
    await executeQuery({ databaseUrl, query: sql });
    return await upload({
      cubeProviderDetails: cubeProviderDetails,
      databaseUrl,
      integrationId,
      version,
    });
  } catch (error) {
    console.log(error);
  }
}
async function upload({
  cubeProviderDetails,
  databaseUrl,
  integrationId,
  version,
}: {
  databaseUrl: string;
  cubeProviderDetails?: Prisma.JsonValue | null;
  integrationId: string;
  version: string;
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
        `COPY "UserFeature_${toVersion(
          integrationId,
          version
        )}" FROM STDIN CSV HEADER DELIMITER ','`
      )
    );
    const outputPath = toOutputPath(integrationId, version);
    const { bucket, prefix } = partitionBucketPrefix(outputPath);

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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const config = req.body as Record<string, unknown>;
  const cubeProviderDetails = config["cubeProviderDetails"] as
    | Prisma.JsonValue
    | undefined;
  const details = config["details"] as Prisma.JsonValue | undefined;
  const route = config["route"] as string | undefined;
  const payload = config["payload"] as Record<string, unknown> | undefined;

  console.log(config);

  const databaseUrl = extractValue({
    object: details,
    paths: ["DATABASE_URL"],
  }) as string | undefined;

  if (!route || !databaseUrl) {
    res.status(404);
  } else {
    try {
      if (route === "checkConnection") {
        const valid = await checkConnection(databaseUrl);
        res.json(valid);
      } else if (route === "executeQuery") {
        const query = payload?.sql as string | undefined;
        if (query) {
          const result = await executeQuery({ databaseUrl, query });
          res.json(result);
        }
      } else if (route === "createPartition") {
        const integrationId = payload?.integrationId as string | undefined;
        const version = payload?.version as string | undefined;

        if (integrationId && version) {
          const sql = `CREATE TABLE IF NOT EXISTS "UserFeature_${integrationId}_${version}" PARTITION OF "UserFeature" FOR VALUES IN ('${version}')`;
          const result = await executeQuery({ databaseUrl, query: sql });
          res.json(result);
        }
      } else if (route === "upload") {
        const integrationId = payload?.integrationId as string | undefined;
        const version = payload?.version as string | undefined;

        if (details && integrationId && version) {
          const result = await uploadAll({
            integrationId,
            version,
            databaseUrl,
            cubeProviderDetails,
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
