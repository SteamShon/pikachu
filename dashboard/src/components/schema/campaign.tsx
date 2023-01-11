import { z } from "zod";

export const campaignSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  placementId: z.string(),
  type: z.string(),
  startedAt: z.date(),
  endAt: z.date(),
  status: z.string(),
  ownerId: z.string(),
  creatorId: z.string(),
});
