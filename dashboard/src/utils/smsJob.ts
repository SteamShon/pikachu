import type {
  AdSet,
  Content,
  ContentType,
  Integration,
  Job,
  Placement,
  Provider,
  Segment,
} from "@prisma/client";
import { parseJsonLogic } from "react-querybuilder";
import {
  formatQueryCustom,
  listFoldersMultiSequential,
  loadS3,
  prependS3ConfigsOnQuery,
  s3ConfigsStatement,
} from "./awsS3DuckDB";
import { extractValue, jsonParseWithFallback } from "./json";
import type { SMSContentTypeDetail } from "./smsContentType";
import { toSmsContentTypeDetails } from "./smsContentType";
import { extractVariables } from "./text";

export type JobInput = {
  details: Partial<SMSContentTypeDetail>;
  placementAdSetsInput: PlacementAdSetsInput[];
};
export type PlacementAdSetsInput = {
  id: string;
  filter?: string;
  variables: string[];
  columns: string[];
  values: Record<string, unknown>;
  template: string;
  placementId: string;
  toColumn: string;
};
export function parseCubeIntegration(
  smsIntegration?: Integration & { provider: Provider | null }
) {
  return extractValue({
    object: smsIntegration?.details,
    paths: ["cubeIntegration"],
  }) as (Integration & { provider: Provider | null }) | undefined;
}
export function parseJobInput(
  placement: Placement & {
    contentType: ContentType;
    adSets: (AdSet & { segment: Segment | null; content: Content })[];
  }
): JobInput | undefined {
  const contentTypeDetails = toSmsContentTypeDetails(
    placement.contentType.details
  );
  if (!contentTypeDetails?.template || !contentTypeDetails?.toColumn)
    return undefined;

  const template = contentTypeDetails.template;
  const placementId = placement.id;
  const toColumn = contentTypeDetails.toColumn;

  const placementAdSetsInput = placement.adSets.map(
    ({ id, segment, content }) => {
      const values = jsonParseWithFallback(content.values);
      const contentTypeDetails = toSmsContentTypeDetails(
        placement.contentType.details
      );
      const variables = extractVariables(contentTypeDetails?.template) || [];
      const rawColumns = contentTypeDetails?.columns || [];
      const columns = rawColumns.map(({ column_name }) => column_name);
      const filter = segment?.where
        ? formatQueryCustom(rawColumns, parseJsonLogic(segment?.where))
        : "1 = 1";

      return {
        id,
        filter,
        variables,
        columns,
        values,
        template,
        placementId,
        toColumn,
      };
    }
  );

  return { details: contentTypeDetails, placementAdSetsInput };
}
function getCubeVariables(input: PlacementAdSetsInput) {
  const { variables, columns } = input;
  return variables.filter(
    (variable) =>
      columns.findIndex((columnName) => columnName === variable) >= 0
  );
}

function buildMessageColumnExpr(input: PlacementAdSetsInput) {
  const { values, template } = input;
  const cubeVariables = getCubeVariables(input);

  const replacedByCubeValues = (cubeVariables || []).reduce(
    (prev, variable) => {
      return `
            replace(
                ${prev}, '{{${variable}}}', ${variable}
            )`;
    },
    `'${template}'`
  );
  const prev = cubeVariables ? replacedByCubeValues : `'${template}'`;
  const userProvidedValues = Object.entries(values).filter(
    ([k]) => !cubeVariables?.includes(k)
  );
  const replaced = userProvidedValues.reduce((prev, [k, v]) => {
    return `
            replace(
                ${prev}, '{{${k}}}', '${v}'
            )`;
  }, prev);

  return `${replaced} AS message`;
}
function buildMatchColumnExpr(input: PlacementAdSetsInput) {
  const { filter, id } = input;
  return `IF (${filter}, '${id}', null) AS ad_set_id`;
}
function buildValuesColumnExpr(input: PlacementAdSetsInput) {
  const { values } = input;
  const cubeVariables = getCubeVariables(input);
  const userProvidedValues = Object.entries(values).filter(
    ([k]) => !cubeVariables.includes(k)
  );
  const userValues = `
      struct_pack(${userProvidedValues
        .map(([k, v]) => {
          return `${k} := '${v}'`;
        })
        .join(", ")}) AS user_values
      `;
  const cubeValues = `
      struct_pack(${(cubeVariables || [])
        .map((k) => {
          return `${k} := ${k}`;
        })
        .join(", ")}) AS cube_values
      `;
  return [userValues, cubeValues];
}
export function buildSelectExprs(inputs: PlacementAdSetsInput[]) {
  return inputs.map((input) => {
    const matched = buildMatchColumnExpr(input);
    const message = buildMessageColumnExpr(input);
    const values = buildValuesColumnExpr(input);
    const primitives = [
      `'${input.placementId}' AS placement_id`,
      `'${input.template}' AS template`,
      `${input.toColumn} AS to_column`,
    ];

    return [...values, ...primitives, message, matched].join(", ");
  });
}
export function buildProcessSql({
  cubeIntegration,
  jobInput,
  s3OutputPath,
}: {
  cubeIntegration: Integration & { provider: Provider };
  jobInput: JobInput;
  s3OutputPath: string;
}) {
  const { details, placementAdSetsInput } = jobInput;
  const selectExprs = buildSelectExprs(placementAdSetsInput);
  const cubeSql = extractValue({
    object: cubeIntegration?.details,
    paths: ["SQL"],
  }) as string | undefined;
  if (!cubeSql) return undefined;
  if (!details?.from) return undefined;

  return `
  DROP TABLE IF EXISTS unionned;
  DROP TABLE IF EXISTS deduplicated;
  DROP TABLE IF EXISTS result;

  CREATE TABLE unionned AS (
    ${selectExprs.map((expr) => {
      return `SELECT ${expr} FROM (${cubeSql})`;
    }).join(`
      UNION ALL 
    `)}
  );

  CREATE TABLE deduplicated AS (
    SELECT  *
    FROM    (
      SELECT  *,
              row_number() OVER (PARTITION BY ad_set_id, to_column ORDER BY to_column) AS seq
      FROM    (
          SELECT  *
          FROM    unionned
          WHERE   ad_set_id is not null
      )
    )
    WHERE   seq = 1
  );

  CREATE TABLE result AS (
    SELECT  placement_id,
            ad_set_id,
            '${details.from}' AS from_column,
            to_column, 
            message,
            template,
            user_values,
            cube_values
    FROM    deduplicated
    ORDER BY to_column ASC
  );

  COPY (SELECT * FROM result) TO '${s3OutputPath}' (FORMAT PARQUET, PARTITION_BY (placement_id, ad_set_id), OVERWRITE_OR_IGNORE);
  `;
}

export async function generateJobSql(job: Job) {
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

  const s3OutputPath = `s3://pikachu-dev/jobs/processed/${job.id}`;

  const query = buildProcessSql({ cubeIntegration, jobInput, s3OutputPath });
  if (!query) return undefined;

  const details = cubeIntegration?.provider?.details;
  const processSql = prependS3ConfigsOnQuery({
    details,
    query,
    extensions: [],
  });
  const resultStatement = s3ConfigsStatement({ details, extensions: [] });

  const what = "received_sms_message";
  const seedPaths = jobInput.placementAdSetsInput.map(({ placementId, id }) => {
    return `${s3OutputPath}/placement_id=${placementId}/ad_set_id=${id}`;
  });
  const s3 = loadS3(details);
  if (!s3) return undefined;

  const bucket = "pikachu-dev";
  const s3OutputPaths = await listFoldersMultiSequential({
    s3,
    bucket,
    seedPaths,
  });

  // const s3OutputPaths = [
  //   "s3://pikachu-dev/partitioned/result/placement_id=cljpfsquk0006mj08cypcvjj9/ad_set_id=cljpfzttf000el308977x7wie/data_0.parquet",
  // ];
  console.log(s3OutputPaths);
  if (!s3OutputPaths) return undefined;

  const resultSql = generateJobResultSql({ what, s3OutputPaths });

  return { processSql, resultStatement, resultSql };
}

function generateJobResultSql({
  what,
  s3OutputPaths,
}: {
  what: string;
  s3OutputPaths: string[];
}) {
  //TODO: change placement_id, from_column, message as struct type then
  // select them as props column once duckdb-rs support Struct type.
  return `
  SELECT  datediff('milliseconds', TIMESTAMP '1970-01-01 00:00:00', CAST(now() AS TIMESTAMP)) AS when,
          to_column AS who,
          '${what}' AS what, 
          ad_set_id AS which,
          placement_id,
          from_column,
          message
  FROM    read_parquet([${s3OutputPaths.map((p) => `'${p}'`).join(", ")}])
  `;
}
