import type {
  AdSet,
  Content,
  ContentType,
  Integration,
  Placement,
  Provider,
  Segment,
} from "@prisma/client";
import { parseJsonLogic } from "react-querybuilder";
import { formatQueryCustom } from "./awsS3DuckDB";
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
  return `IF (${filter}, true, false) AS ${id}`;
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
  DROP TABLE IF EXISTS pivotted;
  DROP TABLE IF EXISTS unpivotted;
  DROP TABLE IF EXISTS deduplicated;
  DROP TABLE IF EXISTS result;

  CREATE TABLE pivotted AS (
    SELECT  *, ${selectExprs}
    FROM    (
        ${cubeSql}
    )
  );

  CREATE TABLE unpivotted AS (
    UNPIVOT pivotted
    ON ${placementAdSetsInput.map(({ id }) => id).join(", ")}
    INTO
        NAME ad_set_id
        VALUE matched
  );

  CREATE TABLE deduplicated AS (
    SELECT  *
    FROM    (
        SELECT  *, 
                row_number() OVER (PARTITION BY to_column ORDER BY to_column) AS seq
        FROM    unpivotted
        WHERE   matched
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
