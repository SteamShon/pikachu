import { z } from "zod";
import { serviceConfigSchema } from "./serviceConfig";

export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  serviceConfig: serviceConfigSchema.optional(),
});

export type ServiceSchemaType = z.infer<typeof serviceSchema>;
