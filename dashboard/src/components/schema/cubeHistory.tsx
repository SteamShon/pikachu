import { z } from "zod";

export const cubeHistorySchema = z.object({
  id: z.string().optional(),
  cubeId: z.string().min(1),
  version: z.string().min(1),
  status: z.string().min(1),
});

export type CubeHistorySchemaType = z.infer<typeof cubeHistorySchema>;
