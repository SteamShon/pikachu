import { z } from "zod";

import { adGroupWithCampaignSchema } from "../../../components/schema/adGroup";
import { campaignSchema } from "../../../components/schema/campaign";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const campaignRouter = createTRPCRouter({
  //deprecated
  update: protectedProcedure
    .input(campaignSchema)
    .mutation(async ({ input }) => {
      const campaign = await prisma.campaign.update({
        where: {
          id: input.id || "",
        },
        data: input,
        include: {
          placement: {
            include: {
              placementGroup: true,
            },
          },
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

      return campaign;
    }),
  addAdGroup: protectedProcedure
    .input(adGroupWithCampaignSchema)
    .mutation(async ({ input }) => {
      const { campaignId, ...adGroupInput } = input;

      const campaign = await prisma.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          adGroups: {
            connectOrCreate: {
              where: {
                campaignId_name: {
                  campaignId: campaignId,
                  name: adGroupInput.name,
                },
              },
              create: adGroupInput,
            },
          },
        },
        include: {
          placement: {
            include: {
              contentType: true,
              placementGroup: {
                include: {
                  service: true,
                },
              },
            },
          },
          adGroups: {
            orderBy: {
              updatedAt: "desc",
            },
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

      return campaign;
    }),
  removeAdGroup: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { campaignId, name } = input;

      const campaign = await prisma.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          adGroups: {
            delete: {
              campaignId_name: {
                campaignId,
                name,
              },
            },
          },
        },
        include: {
          placement: {
            include: {
              contentType: true,
              placementGroup: {
                include: {
                  service: true,
                },
              },
            },
          },
          adGroups: {
            orderBy: {
              updatedAt: "desc",
            },
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

      return campaign;
    }),
  updateAdGroup: protectedProcedure
    .input(adGroupWithCampaignSchema)
    .mutation(async ({ input }) => {
      const { campaignId, ...adGroupInput } = input;

      const campaign = await prisma.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          adGroups: {
            update: {
              where: {
                id: adGroupInput.id || "",
              },
              data: adGroupInput,
            },
          },
        },
        include: {
          placement: {
            include: {
              contentType: true,
              placementGroup: {
                include: {
                  service: true,
                },
              },
            },
          },
          adGroups: {
            orderBy: {
              updatedAt: "desc",
            },
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

      return campaign;
    }),
});
