import { z } from "zod";

export const searchRequestSchema = z.object({
  serviceId: z.string().min(1),
  placementGroupId: z.string().min(1),
  apiServerHost: z.string().min(1),
  dimensionValues: z
    .array(
      z.object({
        dimension: z.string().min(1),
        values: z.array(z.string().min(1)),
      })
    )
    .min(0),
});
export type SearchRequestSchemaType = z.infer<typeof searchRequestSchema>;
