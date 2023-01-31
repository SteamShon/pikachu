import { z } from "zod";

export const placementSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  contentTypeId: z.string().min(1),
  status: z.string().min(1),
});

export type PlacementSchemaType = z.infer<typeof placementSchema>;

export const placementWithPlacementGroupSchema = placementSchema.extend({
  placementGroupId: z.string().min(1),
});

export type PlacementWithPlacementGroupSchemaType = z.infer<
  typeof placementWithPlacementGroupSchema
>;
