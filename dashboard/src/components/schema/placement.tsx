import { z } from "zod";

export const placementSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional().nullable().default(null),
    serviceId: z.string().min(1),
    contentTypeId: z.string().optional().nullable(),
    status: z.string().min(1),
  })
  .transform((o) => {
    return {
      ...o,
      contentTypeId: o.contentTypeId === "" ? null : o.contentTypeId,
    };
  });

export type PlacementSchemaType = z.infer<typeof placementSchema>;
