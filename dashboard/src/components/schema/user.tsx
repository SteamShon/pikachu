import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().optional(),
  image: z.string().optional(),
  role: z.string().optional(),
});
