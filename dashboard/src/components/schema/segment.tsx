import { z } from "zod";

export const segmentSchema = z.object({
  id: z.string().optional(),
  integrationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  where: z.string().optional().nullable(),
  population: z.string().optional().nullable(),
  // ownerId: z.string(),
  // creatorId: z.string(),
});

export type SegmentSchemaType = z.infer<typeof segmentSchema>;
