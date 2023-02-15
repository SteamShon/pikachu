import { z } from "zod";
export const datasetSchema = z.object({
  tables: z.array(
    z.object({
      files: z.array(z.string()),
      conditions: z.array(
        z.object({
          sourceTable: z.string().min(1),
          source: z.string().min(1),
          target: z.string().min(1),
        })
      ),
    })
  ),
});

export type DatasetSchemaType = z.infer<typeof datasetSchema>;
