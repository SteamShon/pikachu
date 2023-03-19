import { z } from "zod";

export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  // placementGroups: z.array(placementGroupSchema),
});

export type ServiceSchemaType = z.infer<typeof serviceSchema>;
