import { z } from "zod";

export const integrationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  type: z.string().min(1),
  //enum(["DB", "HTTP"]),
  status: z.string().min(1),
  placementId: z.string().min(1),
  details: z.optional(z.record(z.unknown())),
});

export type IntegrationSchemaType = z.infer<typeof integrationSchema>;
