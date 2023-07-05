import type {
  AdSet,
  Content,
  ContentType,
  Integration,
  Job,
  Placement,
  Prisma,
  Provider,
  Segment,
} from "@prisma/client";
import { Database } from "duckdb-async";
import type { NextApiRequest, NextApiResponse } from "next";
import { prependS3ConfigsOnQuery } from "../../../utils/awsS3DuckDB";
import { extractValue } from "../../../utils/json";
import { buildProcessSql, parseJobInput } from "../../../utils/smsJob";
import axios from "axios";
import { env } from "../../../env/server.mjs";
import { executeQuery } from "../../../utils/pg";

let _db: Database | undefined = undefined;

const PUBLISH_URI =
  env.EVENT_PUBLISH_URI || `http://localhost:8181/publishes/sms/abc`;

async function getDuckDB() {
  if (!_db) {
    _db = await Database.create(":memory:");
  }
  return _db;
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
async function publishEvents({
  cubeIntegrationProviderDetails,
  windowSize,
  toColumnValueMax,
}: {
  cubeIntegrationProviderDetails: Prisma.JsonValue;
  windowSize: number;
  toColumnValueMax?: string;
}) {
  try {
    const whereClause =
      toColumnValueMax === undefined
        ? `LIMIT ${windowSize}`
        : `WHERE   to_column > '${toColumnValueMax}'`;
    const publishSql = prependS3ConfigsOnQuery({
      details: cubeIntegrationProviderDetails,
      query: `
    SELECT  placement_id,
            ad_set_id,
            from_column,
            to_column,
            message
    FROM    result
    ${whereClause}
    `,
    });

    console.log(publishSql);
    const rows = await executeDuckDBQuery(publishSql);
    const what = "received_sms_message";
    // publish events
    const now = Date.now();
    const events = (rows || []).map((row) => {
      toColumnValueMax = toColumnValueMax
        ? toColumnValueMax > row.to_column
          ? toColumnValueMax
          : row.to_column
        : row.to_column;

      return {
        when: now,
        who: row.to_column,
        what,
        which: row.ad_set_id,
        props: {
          placementId: row.placement_id,
          from: row.from_column,
          to: row.to_column,
          text: row.message,
        },
      };
    });
    axios.post(PUBLISH_URI, events);
    console.log(events);
    return { toColumnValueMax, publishCount: events.length };
  } catch (error) {
    console.log(error);
    return { toColumnValueMax, publishCount: -1 };
  }
}
async function publishToQueue(
  cubeIntegrationProviderDetails: Prisma.JsonValue
) {
  const windowSize = 100;
  let finished = false;
  let toColumnValueMax: string | undefined = undefined;
  let count = 0;

  while (!finished) {
    const { toColumnValueMax: maxValue, publishCount } = await publishEvents({
      cubeIntegrationProviderDetails,
      windowSize,
      toColumnValueMax,
    });
    toColumnValueMax = maxValue;
    finished = publishCount <= 0;
    if (!finished) {
      count += publishCount;
    }
  }

  return count;
}

async function processJob(job: Job) {
  const placement = extractValue({
    object: job.details,
    paths: ["placement"],
  }) as unknown as Placement & {
    contentType: ContentType;
    adSets: (AdSet & { segment: Segment | null; content: Content })[];
  };
  const smsIntegration = extractValue({
    object: job.details,
    paths: ["integration"],
  }) as (Integration & { provider: Provider }) | undefined;
  const cubeIntegration = extractValue({
    object: smsIntegration?.details,
    paths: ["cubeIntegration"],
  }) as (Integration & { provider: Provider }) | undefined;

  if (!cubeIntegration) return undefined;

  const jobInput = parseJobInput(placement);
  if (!jobInput) return undefined;

  const s3OutputPath = "s3://pikachu-dev/partitioned/result";

  const query = buildProcessSql({ cubeIntegration, jobInput, s3OutputPath });
  if (!query) return undefined;

  const details = cubeIntegration?.provider?.details;
  const processQuery = prependS3ConfigsOnQuery({
    details,
    query,
  });
  if (!processQuery || !details) return undefined;
  await executeDuckDBQuery(processQuery);

  return await publishToQueue(details);
}

async function fetchJobs(jobId?: string) {
  try {
    const where = jobId ? `WHERE "id" = '${jobId}'` : "WHERE true";
    const result = await executeQuery({
      databaseUrl: env.DATABASE_URL,
      query: `
      SELECT * 
      FROM   "Job"
      ${where}
      `,
    });
    return result.rows as Job[];
  } catch (error) {
    console.log(error);
    return [];
  }
}
function isSMSJob(job: Job) {
  const integration = extractValue({
    object: job.details,
    paths: ["integration"],
  }) as Integration | undefined;
  return integration?.provide === "SMS";
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const config = req.body as Record<string, unknown>;
  const jobId = config["jobId"] as string | undefined;
  const route = config["route"] as string;
  console.log(config);

  try {
    // if (route === "processJob") {
    const jobs = await fetchJobs(jobId);
    const results = {} as Record<string, number | undefined>;

    for (const job of jobs) {
      if (!isSMSJob(job)) continue;

      console.log(job);
      results[`${job.id || ""}`] = await processJob(job);
    }

    res.json(results);
    res.status(200).end();

    // } else {
    // }
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
};

export default handler;
