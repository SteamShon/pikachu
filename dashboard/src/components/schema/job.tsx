import { z } from "zod";

export const jobSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  integrationId: z.string().min(1),
  placementId: z.string().min(1),
  details: z.optional(z.record(z.unknown())),
});

export type JobSchemaType = z.infer<typeof jobSchema>;
