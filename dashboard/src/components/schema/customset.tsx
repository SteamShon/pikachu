import { z } from "zod";
import { customsetInfoSchema } from "./customsetInfo";

export const customsetSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  // ownerId: z.string(),
  // creatorId: z.string(),
  status: z.string().optional().default("CREATED"),
  info: customsetInfoSchema,
});
