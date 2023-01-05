import { z } from "zod";

export const customsetInfoSchema = z.object({
  filePath: z.string(),
  config: z.string(),
});
