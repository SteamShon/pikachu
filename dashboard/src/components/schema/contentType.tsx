import { z } from "zod";
import { contentTypeInfoSchema } from "./contentTypeInfo";

export const contentTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string().min(1).default("DISPLAY"),
  source: z.string().min(1).default("local"),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  serviceId: z.string().min(1),
  contentTypeInfo: contentTypeInfoSchema.optional(),
});

export type ContentTypeSchemaType = z.infer<typeof contentTypeSchema>;
