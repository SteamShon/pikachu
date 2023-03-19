import { z } from "zod";

export const serviceConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  serviceId: z.string().min(1),
  s3Config: z
    .object({
      s3Region: z.string().optional().default("ap-northeast-2"),
      s3AccessKeyId: z.string().min(1),
      s3SecretAccessKey: z.string().min(1),
    })
    .optional(),
  builderConfig: z
    .object({
      publicKey: z.string().min(1),
      privateKey: z.string().min(1),
    })
    .optional(),
  status: z.string().min(1),
  buckets: z.string().optional().nullable(),
});

export type ServiceConfigSchemaType = z.infer<typeof serviceConfigSchema>;
