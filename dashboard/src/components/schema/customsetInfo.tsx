import { z } from "zod";

export const customsetInfoSchema = z.object({
  id: z.string().optional(),
  filePath: z.string().min(1),
  config: z.string().min(1),
});
