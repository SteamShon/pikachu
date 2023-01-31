import { z } from "zod";

export const creativeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  // ownerId: z.string(),
  // creatorId: z.string(),
});

export type CreativeSchemaType = z.infer<typeof creativeSchema>;

export const creativeWithAdGroupIdAndContentId = creativeSchema.extend({
  adGroupId: z.string().min(1),
  contentId: z.string().min(1),
});

export type CreativeWithAdGroupIdAndContentIdType = z.infer<
  typeof creativeWithAdGroupIdAndContentId
>;
