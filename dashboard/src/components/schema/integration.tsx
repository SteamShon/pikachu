import { z } from "zod";

export const integrationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  provide: z.string().min(1),
  details: z.optional(z.record(z.unknown())),
  status: z.string().min(1),
  serviceId: z.string().min(1),
});

export type IntegrationSchemaType = z.infer<typeof integrationSchema>;

// export const integrationsSchema = z.object({
//   integrations: z.array(integrationSchema),
//   placementId: z.string().min(1),
// });

// export type IntegrationsSchemaType = z.infer<typeof integrationsSchema>;
