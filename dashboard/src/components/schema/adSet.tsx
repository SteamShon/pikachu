import { z } from "zod";

export const adSetSchema = z.object({
  id: z.string().optional(),
  placementId: z.string().min(1),
  contentId: z.string().min(1),
  segmentId: z.string().optional().nullable().default(null),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
});

export type AdSetSchemaType = z.infer<typeof adSetSchema>;
