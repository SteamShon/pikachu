import { z } from "zod";

export const customsetInfoSchema = z.object({
  id: z.string().optional(),
  filePath: z.string(),
  config: z.string(),
});
