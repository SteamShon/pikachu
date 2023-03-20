import { z } from "zod";

export const contentTypeInfoSchema = z
  .object({
    id: z.string().optional(),
    //status: z.string().min(1),/
    contentTypeId: z.string().optional(),
    // source: z.string().min(1).default("local"),
    details: z.optional(z.record(z.unknown())),
  })
  .transform((o) => {
    return {
      ...o,
      contentTypeId: o.contentTypeId === "" ? undefined : o.contentTypeId,
    };
  });

export type ContentTypeInfoSchemaType = z.infer<typeof contentTypeInfoSchema>;
