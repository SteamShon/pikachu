import type { GetQueryResultsCommandOutput } from "@aws-sdk/client-athena";
import {
  AthenaClient,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  QueryExecutionState,
  StartQueryExecutionCommand,
} from "@aws-sdk/client-athena";
import type { Prisma } from "@prisma/client";
import {
  extractS3AccessKeyId,
  extractS3Region,
  extractS3SecretAccessKey,
} from "./awsS3DuckDB";
type AWSConfig = {
  region: string;
  credentials: AWSCredential;
};
type AWSCredential = {
  accessKeyId: string;
  secretAccessKey: string;
};
export function parseAWSConfig(details?: Prisma.JsonValue) {
  const region = extractS3Region(details);
  const credentials = parseAwsCredential(details);
  if (!region || !credentials) return undefined;

  return { region, credentials };
}
export function parseAwsCredential(details?: Prisma.JsonValue) {
  const accessKeyId = extractS3AccessKeyId(details);
  const secretAccessKey = extractS3SecretAccessKey(details);

  if (!accessKeyId || !secretAccessKey) return undefined;
  return { accessKeyId, secretAccessKey };
}
async function getQueryExecution({
  athena,
  QueryExecutionId,
  tryNum,
}: {
  athena: AthenaClient;
  QueryExecutionId: string;
  tryNum: number;
}): Promise<GetQueryResultsCommandOutput | undefined> {
  console.log(tryNum);
  if (tryNum >= 10) throw Error("too many tryNum");

  const command = new GetQueryExecutionCommand({ QueryExecutionId });
  try {
    const response = await athena.send(command);
    const state = response.QueryExecution?.Status?.State;
    // console.log(state);

    if (
      state === QueryExecutionState.QUEUED ||
      state === QueryExecutionState.RUNNING
    ) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          getQueryExecution({
            athena,
            QueryExecutionId,
            tryNum: tryNum + 1,
          })
            .then((res) => resolve(res))
            .catch((e) => reject(e));
        }, 1000);
      });
      //   setTimeout(async () => {
      //     return await getQueryExecution({
      //       athena,
      //       QueryExecutionId,
      //       tryNum: tryNum + 1,
      //     });
      //   }, 1000);
    } else if (state === QueryExecutionState.SUCCEEDED) {
      const params = {
        QueryExecutionId: response.QueryExecution?.QueryExecutionId,
        MaxResults: 100,
      };

      const command = new GetQueryResultsCommand(params);

      const result = await athena.send(command);
      console.log(result);

      return result;
    } else if (state === QueryExecutionState.FAILED) {
      throw new Error(
        `Query failed: ${response.QueryExecution?.Status?.StateChangeReason}`
      );
    } else if (state === QueryExecutionState.CANCELLED) {
      throw new Error("Query was cancelled");
    }

    return undefined;
  } catch (error) {
    console.log(error);
    return undefined;
  } finally {
  }
}
export async function executeAthenaQuery({
  config,
  query,
  database,
  catalog,
  workgroup,
  outputLocation,
}: {
  config: {
    region: string;
    credentials: AWSCredential;
  };
  query: string;
  database?: string;
  catalog?: string;
  workgroup?: string;
  outputLocation?: string;
}) {
  console.log(query);
  const athena = new AthenaClient(config);

  const params = {
    QueryString: query,
    WorkGroup: workgroup,
    ResultConfiguration: {
      OutputLocation: outputLocation || "s3://pikachu-dev/athena/",
    },
    ResultReuseConfiguration: {
      ResultReuseByAgeConfiguration: {
        Enabled: false,
      },
    },
    QueryExecutionContext: {
      Catalog: catalog || "AwsDataCatalog",
      Database: database || "default",
    },
  };
  const command = new StartQueryExecutionCommand(params);
  // async/await.
  try {
    const { QueryExecutionId } = await athena.send(command);
    if (!QueryExecutionId) return;
    const result = await getQueryExecution({
      athena,
      QueryExecutionId,
      tryNum: 0,
    });
    console.log(result);

    const columns = (
      result?.ResultSet?.ResultSetMetadata?.ColumnInfo || []
    ).map(({ Name }) => Name);
    const rows = result?.ResultSet?.Rows?.map(({ Data }) => {
      const needSplit = (Data?.length || 0) < columns.length;
      const values = (Data || []).flatMap((datum) => {
        return datum.VarCharValue?.split("\t") || [];
      });
      console.log(values.length === columns.length);

      return columns.reduce((prev, column, i) => {
        const value = needSplit ? values[i] : Data?.[i]?.VarCharValue;
        if (!column || !value) return prev;
        prev[column] = value;
        return prev;
      }, {} as Record<string, unknown>);
    });
    console.log(rows);
    return rows;
  } catch (error) {
    // error handling.
    console.log(error);
    return undefined;
  } finally {
    // finally.
  }
}

export async function runAthenaQuery({
  details,
  query,
  database,
  catalog,
}: {
  query: string;
  details?: Prisma.JsonValue;
  database?: string;
  catalog?: string;
}) {
  const config = parseAWSConfig(details);
  if (!config) return undefined;

  return await executeAthenaQuery({ config, query, database, catalog });
}
