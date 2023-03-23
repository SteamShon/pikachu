import { z } from "zod";

import { campaignWithPlacementSchema } from "../../../components/schema/campaign";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const placementRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1) }))
    .query(async ({ input }) => {
      const { serviceId } = input;
      const placements = await prisma.placement.findMany({
        where: {
          serviceId,
        },
        include: {
          cube: {
            include: {
              serviceConfig: true,
            },
          },
          contentType: {
            include: {
              contentTypeInfo: true,
              contents: true,
            },
          },
        },
      });

      return placements;
    }),
  addCampaign: protectedProcedure
    .input(campaignWithPlacementSchema)
    .mutation(async ({ input }) => {
      const { placementId, ...campaignInput } = input;

      const placement = await prisma.placement.update({
        where: {
          id: placementId,
        },
        data: {
          campaigns: {
            connectOrCreate: {
              where: {
                placementId_name: {
                  placementId: placementId,
                  name: campaignInput.name,
                },
              },
              create: campaignInput,
            },
          },
        },
        include: {
          service: true,
          contentType: true,
          campaigns: {
            orderBy: {
              updatedAt: "desc",
            },
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
          },
        },
      });

      return placement;
    }),
  updateCampaign: protectedProcedure
    .input(campaignWithPlacementSchema)
    .mutation(async ({ input }) => {
      const { placementId, ...campaignInput } = input;

      const placement = await prisma.placement.update({
        where: {
          id: placementId,
        },
        data: {
          campaigns: {
            update: {
              where: {
                id: campaignInput.id || "",
              },
              data: campaignInput,
            },
          },
        },
        include: {
          service: true,
          contentType: true,
          campaigns: {
            orderBy: {
              updatedAt: "desc",
            },
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
          },
        },
      });

      return placement;
    }),
  removeCampaign: protectedProcedure
    .input(
      z.object({
        placementId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { placementId, name } = input;

      const placement = await prisma.placement.update({
        where: {
          id: placementId,
        },
        data: {
          campaigns: {
            delete: {
              placementId_name: {
                placementId,
                name,
              },
            },
          },
        },
        include: {
          service: true,
          contentType: true,
          campaigns: {
            orderBy: {
              updatedAt: "desc",
            },
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
          },
        },
      });

      return placement;
    }),
});
