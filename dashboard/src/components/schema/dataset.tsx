import { z } from "zod";
export const datasetPathSchema = z.object({
  files: z.array(z.string()),
  alias: z.string(),
});
export const targetDatasetSchema = z.object({
  target: datasetPathSchema,
  conditions: z.array(
    z.object({
      source: z.string().min(1),
      target: z.string().min(1),
    })
  ),
});

export const datasetSchema = z.object({
  source: datasetPathSchema,
  targets: z.array(targetDatasetSchema),
});

export type DatasetSchemaType = z.infer<typeof datasetSchema>;

export type TargetDatasetSchemaType = z.infer<typeof targetDatasetSchema>;

export type DatasetPathSchemaType = z.infer<typeof datasetPathSchema>;
