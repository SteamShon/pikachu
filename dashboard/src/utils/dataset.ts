import type { DatasetSchemaType } from "../components/schema/dataset";

export function buildJoinSql({ dataset }: { dataset: DatasetSchemaType }) {
  const targets = dataset.tables.map((target, index) => {
    const read = target.files.map((file) => `'${file}'`).join(",");
    const conditions = target.conditions.map(
      ({ sourceTable, sourceColumn, targetColumn }) => {
        return `t_${sourceTable}.${sourceColumn} = t_${index}.${targetColumn}`;
      }
    );
    const conditionsClause =
      conditions.length === 0 ? "" : `ON (${conditions.join(" AND ")})`;
    return `read_parquet([${read}]) AS t_${index} ${conditionsClause}`;
  });
  const from = targets.join(" JOIN ");
  return `
SELECT  *
FROM    ${from}
    `;
}

export function fromSql(sql?: string): DatasetSchemaType | undefined {
  if (!sql) return undefined;

  const matches = sql.matchAll(/read_parquet(.*?)AS(.*?)(JOIN|\n)/gm);
  const datasets = [];

  for (const match of matches) {
    const files = (
      match[1]?.replace(/\[|\]|\(|\)|'/g, "")?.split(",") || []
    ).map((file) => file.trim());
    const conditions = [];
    for (const condition of match[2]?.matchAll(/\((.*)\.(.*)=(.*)\.(.*)\)/gm) ||
      []) {
      const tokens = condition[1]?.split("_");
      const sourceTable = tokens?.[tokens.length - 1];
      if (sourceTable && condition[2] && condition[4]) {
        conditions.push({
          sourceTable,
          sourceColumn: condition[2],
          targetColumn: condition[4],
        });
      }
    }
    datasets.push({ files, conditions });
  }

  return { tables: datasets };
}
