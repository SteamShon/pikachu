import { z } from "zod";

export const segmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  where: z.string().optional().nullable().default(null),
  population: z.string().optional().nullable().default(null),
});

export type SegmentSchemaType = z.infer<typeof segmentSchema>;

export const segmentWithCubeSchema = segmentSchema.extend({
  cubeId: z.string().min(1),
});

export type SegmentWithCubeSchemaType = z.infer<typeof segmentWithCubeSchema>;
