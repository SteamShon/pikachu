import { z } from "zod";

export const placementSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional().nullable().default(null),
    serviceId: z.string().min(1),
    contentTypeId: z.string().optional().nullable(),
    cubeId: z.string().optional().nullable(),
    providerId: z.string().optional().nullable(),
    status: z.string().min(1),
  })
  .transform((o) => {
    return {
      ...o,
      contentTypeId: o.contentTypeId === "" ? null : o.contentTypeId,
      cubeId: o.cubeId === "" ? null : o.cubeId,
      providerId: o.providerId === "" ? null : o.providerId,
    };
  });

export type PlacementSchemaType = z.infer<typeof placementSchema>;
