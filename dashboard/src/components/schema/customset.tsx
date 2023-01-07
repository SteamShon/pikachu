import { z } from "zod";
import { customsetInfoSchema } from "./customsetInfo";

export const customsetSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  creatorId: z.string().optional(),
  status: z.string().optional().default("CREATED"),
  info: customsetInfoSchema,
});
