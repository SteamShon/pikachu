import { z } from "zod";

export const integrationInfoSchema = z
  .object({
    id: z.string().optional(),
    integrationId: z.string().min(1).optional(),
    details: z.optional(z.record(z.unknown())),
  })
  .transform((o) => {
    return {
      ...o,
      integrationId: o.integrationId === "" ? undefined : o.integrationId,
    };
  });

export type IntegrationInfoSchemaType = z.infer<typeof integrationInfoSchema>;
