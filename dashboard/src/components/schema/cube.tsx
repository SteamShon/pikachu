import { z } from "zod";

export const cubeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  serviceConfigId: z.string().min(1),
  status: z.string().min(1),
  sql: z.string().optional().nullable(),
});

export type CubeSchemaType = z.infer<typeof cubeSchema>;
