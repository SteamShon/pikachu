import { z } from "zod";

// const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
// type Literal = z.infer<typeof literalSchema>;
// type Json = Literal | { [key: string]: Json } | Json[];
// const jsonSchema: z.ZodType<Json> = z.lazy(() =>
//   z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
// );

export const contentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  values: z.record(z.unknown()),
  //values: jsonSchema,
});

export type ContentSchemaType = z.infer<typeof contentSchema>;

export const contentWithContentTypeSchema = contentSchema.extend({
  contentTypeId: z.string().min(1),
});

export type ContentWithContentTypeSchemaType = z.infer<
  typeof contentWithContentTypeSchema
>;
