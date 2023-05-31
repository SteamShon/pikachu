// async/await
import type { NextApiRequest, NextApiResponse } from "next";
import pg from "pg";

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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const config = req.body as Record<string, unknown>;
  const databaseUrl = config["DATABASE_URL"] as string | undefined;

  if (!databaseUrl) {
    res.status(404).end();
  } else {
    try {
      const result = await checkConnection(databaseUrl);
      res.json(result);
      res.status(200).end();
    } catch (error) {
      res.status(500).end();
    }
  }
};

export default handler;
