import { z } from "zod";

export const contentTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string().min(1).default("DISPLAY"),
  details: z.optional(z.record(z.unknown())),
  source: z.string().min(1).default("local"),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  serviceId: z.string().min(1),
});

export type ContentTypeSchemaType = z.infer<typeof contentTypeSchema>;
