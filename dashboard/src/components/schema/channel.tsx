import { z } from "zod";
import { providerSchema } from "./provider";

export const channelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  type: z.string().min(1),
  //enum(["DISPLAY", "INAPP_PUSH", "SMS", "EMAIL", "ATA", "FTA"]),
  status: z.string().min(1),
  serviceId: z.string().min(1),
  provider: providerSchema.optional(),
});

export type ChannelSchemaType = z.infer<typeof channelSchema>;
