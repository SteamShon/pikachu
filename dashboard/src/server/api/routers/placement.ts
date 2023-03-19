import { z } from "zod";

import { campaignWithPlacementSchema } from "../../../components/schema/campaign";
import { placementSchema } from "../../../components/schema/placement";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const placementRouter = createTRPCRouter({
  update: protectedProcedure
    .input(placementSchema)
    .mutation(async ({ input }) => {
      const placement = await prisma.placement.update({
        where: {
          id: input.id || "",
        },
        data: input,
        include: {
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
