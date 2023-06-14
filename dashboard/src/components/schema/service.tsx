import { Integration, Service } from "@prisma/client";
import { z } from "zod";

export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  details: z.optional(z.record(z.unknown())),
});

export type ServiceSchemaType = z.infer<typeof serviceSchema>;

export type ServiceIntegrations = Service & { integrations: Integration[] };
