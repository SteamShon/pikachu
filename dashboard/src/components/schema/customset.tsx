import { z } from "zod";
import { customsetInfoSchema } from "./customsetInfo";

export const customsetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().optional().default("CREATED"),
  customsetInfo: customsetInfoSchema,
});

export type CustomsetSchemaType = z.infer<typeof customsetSchema>;

export const customsetWithServiceSchema = customsetSchema.extend({
  serviceId: z.string().min(1),
});

export type CustomsetWithServiceSchemaType = z.infer<
  typeof customsetWithServiceSchema
>;
