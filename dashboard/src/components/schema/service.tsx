import { z } from "zod";
import { contentTypeSchema } from "./contentType";
import { placementGroupSchema } from "./placementGroup";

export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  // placementGroups: z.array(placementGroupSchema),
});

export const serviceWithPlacementGroupSchema = serviceSchema.extend({
  placementGroup: placementGroupSchema,
});

export const serviceWithContentTypeSchema = serviceSchema.extend({
  contentType: contentTypeSchema,
});

export type ServiceSchemaType = z.infer<typeof serviceSchema>;

export type ServiceWithPlacementGroupSchemaType = z.infer<
  typeof serviceWithPlacementGroupSchema
>;

export type ServiceWithContentTypeSchemaType = z.infer<
  typeof serviceWithContentTypeSchema
>;
