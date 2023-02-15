import type { DatasetSchemaType } from "../components/schema/dataset";

export function buildJoinSql(dataset: DatasetSchemaType) {
  console.log(dataset);
  const targets = dataset.tables.map((target, index) => {
    const read = target.files.map((file) => `'${file}'`).join(",");
    const conditions = target.conditions.map(
      ({ sourceTable, source, target }) => {
        return `t_${sourceTable}.${source} = t_${index}.${target}`;
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
      if (condition[1] && condition[2] && condition[4]) {
        conditions.push({
          sourceTable: condition[1],
          source: condition[2],
          target: condition[4],
        });
      }
    }
    datasets.push({ files, conditions });
  }

  return { tables: datasets };
}
