import { Prisma, PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import LRU from "lru-cache";

const pool = new LRU<string, PrismaClient>({
  max: 10, // # of items
  ttl: 10 * 60 * 1000, // expiration in ms (10 min)
  disposeAfter: (value) => {
    console.log("eviction: ", value);
    value.$disconnect();
  },
});
function getClient(databaseUrl: string): PrismaClient | undefined {
  const client = pool.get(databaseUrl);
  if (client) {
    return client;
  }
  pool.set(
    databaseUrl,
    new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  );
  return pool.get(databaseUrl);
}
export function removePlaceholder(s: string) {
  return s.replace("{", "").replace("}", "");
}
export function extractParams(rawSql?: string) {
  const params = [];
  if (!rawSql) return [];

  for (const param of rawSql.matchAll(/{.*}/gm)) {
    params.push(param[0]);
  }
  return params;
}
//note that every key in data should be enclosed with {}
export function escapeTabNewlineSpace(
  rawSql: string,
  data: Record<string, unknown>
): string {
  let sql = rawSql
    .split("\n")
    .filter((line) => line.indexOf("--") !== 0)
    .join("\n")
    .replace(/(\r\n|\n|\r)/gm, " ") // remove newlines
    .replace(/\s+/g, " ") // excess white space
    .replace(/\\"/gm, '"');

  const params = sql.matchAll(/{.*}/gm);
  for (const param of params) {
    const key = param[0];
    const value = data[`${key}`] as string | undefined;

    if (value) {
      sql = sql.replace(key, value);
    }
  }
  return sql;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const config = req.body as Record<string, unknown>;
  const DATABASE_URL = config["DATABASE_URL"] as string | undefined;
  const RAW_SQL = config["SQL"] as string | undefined;

  if (!DATABASE_URL || !RAW_SQL) {
    res.status(404);
  } else {
    const client = getClient(DATABASE_URL);
    if (!client) {
      res.status(404).end();
    } else {
      try {
        const SQL = escapeTabNewlineSpace(RAW_SQL, config);

        const x = Prisma.sql([`${SQL}`]);

        //console.log(x);
        const result = await client.$queryRaw(x);
        res.json(result);
        res.status(200).end();
      } catch (error) {
        res.json(error);
        res.status(500).end();
      }
    }
  }
};

export default handler;
