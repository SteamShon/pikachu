/**
 * Proxy server between client <-> event server(rust).
 * Since it is not possible to run duckdb-node on
 * vercel runtime.
 *
 * it deploy serverless functions into aws lambda
 * wihch is not working with published duckdb-node)
 *
 * https://github.com/duckdb/duckdb/issues/7088
 */
import type { Integration, Job } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { extractValue } from "../../../../utils/json";
import { executeQuery } from "../../../../utils/pg";
import { env } from "../../../../env/server.mjs";
import { generateJobSql } from "../../../../utils/smsJob";
import axios from "axios";

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
async function runAllJobs(jobs: Job[]) {
  const results = {} as Record<string, unknown>;
  for (const job of jobs) {
    if (!isSMSJob(job)) continue;

    const res = await runJob(job);
    Object.entries(res).forEach(([k, v]) => {
      results[k] = v;
    });
  }
  return results;
}
async function runJob(job: Job) {
  const results = {} as Record<
    string,
    {
      generate?: {
        statusText: string;
        error?: string | undefined;
      };
      publish?: {
        statusText: string;
        counts: { [k: string]: number };
        error?: string | undefined;
      };
    }
  >;
  const generate = await generateJobResult(job);
  const publish = await publishJobResult(job);
  results[job.id] = { generate, publish };

  return results;
}
async function generateJobResult(job: Job) {
  const query = await generateJobSql(job);
  if (!query) return undefined;

  const { processSql } = query;
  try {
    const { data: processData } = await axios.post(
      `http://localhost:8181/duckdb/execute_batch`,
      {
        statement: processSql,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return processData as { statusText: string; error?: string };
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

async function publishJobResult(job: Job) {
  const query = await generateJobSql(job);
  if (!query) return undefined;

  const { resultStatement, resultSql } = query;
  try {
    const { data: resultData } = await axios.post(
      `http://localhost:8181/duckdb/query_sink_to_kafka`,
      {
        statement: resultStatement,
        query: resultSql,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return resultData as {
      statusText: string;
      counts: { [k: string]: number };
      error?: string;
    };
  } catch (error) {
    console.log(error);
    return undefined;
  }
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const config = req.body as Record<string, unknown>;
  const job = config["job"] as Job | undefined;
  //   const jobId = config["jobId"] as string | undefined;
  //   console.log(config);

  try {
    // const jobs = await fetchJobs(jobId);
    if (job) {
      const data = await runJob(job);
      res.json(data);
    } else {
      const jobs = await fetchJobs();
      const data = await runAllJobs(jobs);
      res.json(data);
    }

    res.status(200).end();
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
};

export default handler;
