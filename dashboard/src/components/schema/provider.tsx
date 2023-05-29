import { z } from "zod";

export const providerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  provide: z.string().min(1),
  //enum(["DISPLAY", "INAPP_PUSH", "SMS", "EMAIL", "ATA", "FTA"]),
  status: z.string().min(1),
  serviceId: z.string().min(1),
  details: z.optional(z.record(z.unknown())),
});
// .transform((o) => {
//   return {
//     ...o,
//     serviceId: o.serviceId === "" ? undefined : o.serviceId,
//   };
// });

export type ProviderSchemaType = z.infer<typeof providerSchema>;
