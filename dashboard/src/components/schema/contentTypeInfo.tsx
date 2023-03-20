import { z } from "zod";

export const contentTypeInfoSchema = z.object({
  id: z.string().optional(),
  //status: z.string().min(1),/
  contentTypeId: z.string().min(1),
  // source: z.string().min(1).default("local"),
  details: z.record(z.unknown()),
});

export type ContentTypeInfoSchemaType = z.infer<typeof contentTypeInfoSchema>;
