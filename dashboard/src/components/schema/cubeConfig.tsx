import { z } from "zod";

export const cubeConfigSchema = z.object({
  id: z.string().optional(),
  s3Region: z.string().optional().default("ap-northeast-2"),
  s3AccessKeyId: z.string().min(1),
  s3SecretKeyId: z.string().min(1),
  s3Path: z.string().min(1),
  status: z.string().min(1),
});

export type CubeConfigSchemaType = z.infer<typeof cubeConfigSchema>;
