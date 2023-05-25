import { z } from "zod";

export const providerSchema = z
  .object({
    id: z.string().optional(),
    channelId: z.string().min(1).optional(),
    details: z.optional(z.record(z.unknown())),
  })
  .transform((o) => {
    return {
      ...o,
      channelId: o.channelId === "" ? undefined : o.channelId,
    };
  });

export type ProviderSchemaType = z.infer<typeof providerSchema>;
