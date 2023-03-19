import { z } from "zod";

export const placementSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  serviceId: z.string().min(1),
  contentTypeId: z.string().min(1),
  status: z.string().min(1),
});

export type PlacementSchemaType = z.infer<typeof placementSchema>;
