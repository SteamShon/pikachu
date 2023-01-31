import { z } from "zod";

export const campaignSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional().nullable().default(null),
  type: z.string().min(1),
  startedAt: z.date().optional().nullable(),
  endAt: z.date().optional().nullable(),
  status: z.string().min(1),
  // ownerId: z.string(),
  // creatorId: z.string(),
});

export type CampaignSchemaType = z.infer<typeof campaignSchema>;

export const campaignWithPlacementSchema = campaignSchema.extend({
  placementId: z.string().min(1),
});

export type CampaignWithPlacementSchemaType = z.infer<
  typeof campaignWithPlacementSchema
>;
