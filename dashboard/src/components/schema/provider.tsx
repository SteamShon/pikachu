import { z } from "zod";

export const providerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  details: z.optional(z.record(z.unknown())),
  template: z.string().min(1),
  serviceId: z.string().min(1),
});

export type ProviderSchemaType = z.infer<typeof providerSchema>;
