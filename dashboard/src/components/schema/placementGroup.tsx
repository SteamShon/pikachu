import { z } from "zod";

export const placementGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  cubeId: z.string().optional().nullable(),
  // placements: z.array(placementSchema),
});

export type PlacementGroupSchemaType = z.infer<typeof placementGroupSchema>;

export const placementGroupWithServiceSchema = placementGroupSchema.extend({
  serviceId: z.string().min(1),
});

export type PlacementGroupWithServiceSchemaType = z.infer<
  typeof placementGroupWithServiceSchema
>;
