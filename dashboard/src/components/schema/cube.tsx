import { z } from "zod";

export const cubeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  s3Path: z.string().min(1),
});

export type CubeSchemaType = z.infer<typeof cubeSchema>;

export const cubeWithCubeConfigSchema = cubeSchema.extend({
  cubeConfigId: z.string().min(1),
});

export type CubeWithCubeConfigSchemaType = z.infer<
  typeof cubeWithCubeConfigSchema
>;
