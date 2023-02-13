import type { DatasetSchemaType } from "../components/schema/dataset";

export function buildJoinSql(dataset: DatasetSchemaType) {
  console.log(dataset);
  const sources = dataset.files.map((file) => `'${file}'`).join(",");
  const source = `read_parquet([${sources}]) AS source`;
  const targets = dataset.targets.map((target, index) => {
    const read = target.files.map((file) => `'${file}'`).join(",");
    const conditions = target.conditions.map((condition) => {
      return `source.${condition.source} = t_${index}.${condition.target}`;
    });
    return `read_parquet([${read}]) AS t_${index} ON (${conditions.join(
      " AND "
    )})`;
  });
  const from = [source, ...targets].join(" JOIN ");
  return `
SELECT  *
FROM    ${from}
    `;
}

export function fromSql(sql: string): DatasetSchemaType | undefined {
  const matches = sql.matchAll(/read_parquet(.*?)AS(.*?)(JOIN|\n)/gm);
  const datasets = [];

  for (const match of matches) {
    const files = match[1]?.match(/\[(.*?)\]/gm)?.[0].split(",") || [];
    const conditions = [];

    for (const condition of match[2]?.matchAll(/\((.*)\.(.*)=(.*)\.(.*)\)/gm) ||
      []) {
      if (condition[2] && condition[4]) {
        conditions.push({ source: condition[2], target: condition[4] });
      }
    }
    datasets.push({ files, conditions });
  }
  const source = datasets.find((dataset) => dataset.conditions.length === 0);
  if (!source) return undefined;
  const targets = datasets.filter((dataset) => dataset.conditions.length !== 0);
  return { files: source.files, targets };
}
