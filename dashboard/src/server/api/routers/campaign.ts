import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "../../db";
import { campaignSchema } from "../../../components/schema/campaign";

export const campaignRouter = createTRPCRouter({
  create: protectedProcedure
    .input(campaignSchema)
    .mutation(async ({ input, ctx }) => {
      console.log(ctx.session);
      const campaign = await prisma.campaign.create({
        data: {
          name: input.name,
          description: input.description,
          ownedBy: {
            connect: {
              id: input.ownerId,
            },
          },
          createdBy: {
            connect: {
              id: input.creatorId,
            },
          },
          placement: {
            connect: {
              id: input.placementId,
            },
          },
          type: input.type,
          startedAt: input.startedAt,
          endAt: input.endAt,
          status: input.status,
        },
      });

      return campaign;
    }),
  getAll: protectedProcedure.query(({ ctx }) => {
    return prisma.campaign.findMany({
      include: {
        adGroups: {
          include: {
            creatives: {
              include: {
                content: true,
              },
            },
          },
        },
      },
    });
  }),
});
