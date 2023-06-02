// Server side
// async/await
import type { Prisma, Provider } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { Database } from "duckdb-async";
import {
  extractConfigs,
  listFoldersRecursively,
  prependS3ConfigsOnQuery,
} from "../../../utils/providers/awsS3DuckDB";

async function checkConnection(configs: ReturnType<typeof extractConfigs>) {
  if (!configs) {
    return false;
  } else {
    const { s3, buckets } = configs;
    const bucketName = buckets.split(",")[0];
    if (!bucketName) return false;
    try {
      await listFoldersRecursively({ s3, bucketName });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
async function getDuckDB() {
  return await Database.create(":memory:");
}

async function getColumns({
  details,
  query,
}: {
  details?: Prisma.JsonValue | null;
  query: string;
}) {
  const duckdb = await getDuckDB();

  // describe
  const describeSql = prependS3ConfigsOnQuery({
    details,
    query: `DESCRIBE ${query}`,
  });
  if (!describeSql) return [];

  const rows = await duckdb.all(describeSql);

  return rows.map((row) => row.column_name as string);
}

function toOutputPath(cubeHistoryId: string) {
  return `s3://pikachu-dev/dashboard/user-feature/${cubeHistoryId}.csv`;
}
async function transform({
  details,
  query,
  cubeHistoryId,
}: {
  details?: Prisma.JsonValue | null;
  query: string;
  cubeHistoryId: string;
}) {
  const columns = await getColumns({ details, query });
  const duckdb = await getDuckDB();
  const outputPath = toOutputPath(cubeHistoryId);
  const transformSql = prependS3ConfigsOnQuery({
    details,
    query: `
    DROP TABLE IF EXISTS download;
    CREATE TABLE download AS (
        SELECT  '${cubeHistoryId}' AS cubeHistoryId,
                userId,
                to_json((${columns.join(",")})) AS feature
        FROM    (${query})
    );
    COPY (SELECT * FROM download) TO '${outputPath}' (HEADER, DELIMITER ',');
    `,
  });
  if (!transformSql) return [];

  const rows = await duckdb.all(transformSql);
  return rows;
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = req.body as Provider;
  const configs = extractConfigs(provider.details);

  if (!configs) {
    res.status(404).end();
  } else {
    try {
      const result = await checkConnection(configs);
      res.json(result);
      res.status(200).end();
    } catch (error) {
      res.status(500).end();
    }
  }
};

export default handler;
