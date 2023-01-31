import { z } from "zod";
import { contentSchema } from "./content";

export const contentTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional().nullable().default(null),
  schema: z.string().optional().nullable().default(null),
  uiSchema: z.string().optional().nullable().default(null),
  defaultValues: z.record(z.unknown()).optional().nullable(),
  status: z.string().min(1),
});

export const contentTypeWithContentSchema = contentTypeSchema.extend({
  content: contentSchema,
});

export type ContentTypeSchemaType = z.infer<typeof contentTypeSchema>;

export type ContentTypeWithContentSchemaType = z.infer<
  typeof contentTypeWithContentSchema
>;
