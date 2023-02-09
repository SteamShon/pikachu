import { z } from "zod";

export const cubeConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  s3Region: z.string().optional().default("ap-northeast-2"),
  s3AccessKeyId: z.string().min(1),
  s3SecretAccessKey: z.string().min(1),
  status: z.string().min(1),
});

export type CubeConfigSchemaType = z.infer<typeof cubeConfigSchema>;

export const cubeConfigWithServiceSchema = cubeConfigSchema.extend({
  serviceId: z.string().min(1),
});

export type CubeConfigWithServiceSchemaType = z.infer<
  typeof cubeConfigWithServiceSchema
>;
