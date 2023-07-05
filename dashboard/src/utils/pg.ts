import pg from "pg";

export async function executeQuery({
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
