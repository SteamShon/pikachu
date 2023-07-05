// Server side
// async/await
import type { Prisma } from "@prisma/client";
import { Database } from "duckdb-async";
import type { NextApiRequest, NextApiResponse } from "next";
import { extractConfigs } from "../../../utils/awsS3DuckDB";

// async function checkConnection(configs: ReturnType<typeof extractConfigs>) {
//   if (!configs) {
//     return false;
//   } else {
//     const { s3, buckets } = configs;
//     const bucketName = buckets[0];
//     if (!bucketName) return false;
//     try {
//       await listFoldersRecursively({ s3, bucketName });
//       return true;
//     } catch (e) {
//       console.error(e);
//       return false;
//     }
//   }
// }
async function getDuckDB() {
  return await Database.create(":memory:");
}
async function executeDuckDBQuery(query?: string) {
  console.log(query);
  if (!query) return [];
  try {
    const duckdb = await getDuckDB();
    const rows = await duckdb.all(query);
    return rows;
  } catch (error) {
    console.log(error);
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const config = req.body as Record<string, unknown>;
  const details = config["details"] as Prisma.JsonValue | undefined;
  const route = config["route"] as string | undefined;
  const payload = config["payload"] as Record<string, unknown> | undefined;

  console.log(config);

  const configs = extractConfigs(details);

  if (!configs || !route) {
    console.log(configs);
    res.status(404).end();
  } else {
    try {
      // if (route === "checkConnection") {
      //   const result = await checkConnection(configs);
      //   res.json(result);
      //   res.status(200).end();
      // } else
      if (route === "executeDuckDBQuery") {
        const sql = payload?.sql as string | undefined;
        const result = await executeDuckDBQuery(sql);
        console.log(result);
        res.json(result);
        res.status(200).end();
      } else {
        res.status(404).end();
      }
    } catch (error) {
      res.status(500).end();
    }
  }
};

export default handler;
