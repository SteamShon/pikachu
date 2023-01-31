import { z } from "zod";

export const adGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable().default(null),
  status: z.string().min(1),
  filter: z.string().optional().nullable(),
  // ownerId: z.string(),
  // creatorId: z.string(),
});

export type AdGroupSchemaType = z.infer<typeof adGroupSchema>;

export const adGroupWithCampaignSchema = adGroupSchema.extend({
  campaignId: z.string().min(1),
});

export type AdGroupWithCampaignSchemaType = z.infer<
  typeof adGroupWithCampaignSchema
>;
