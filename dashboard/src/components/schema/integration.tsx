import { z } from "zod";
import { integrationInfoSchema } from "./integrationInfo";

export const integrationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  type: z.string().min(1),
  //enum(["DB", "HTTP"]),
  status: z.string().min(1),
  placementId: z.string().min(1),
  integrationInfo: integrationInfoSchema.optional(),
});

export type IntegrationSchemaType = z.infer<typeof integrationSchema>;
