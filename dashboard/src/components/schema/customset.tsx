import { z } from "zod";

export const customsetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().optional().default("CREATED"),
  details: z.optional(z.record(z.unknown())),
});

export type CustomsetSchemaType = z.infer<typeof customsetSchema>;

export const customsetWithServiceSchema = customsetSchema.extend({
  serviceId: z.string().min(1),
});

export type CustomsetWithServiceSchemaType = z.infer<
  typeof customsetWithServiceSchema
>;
