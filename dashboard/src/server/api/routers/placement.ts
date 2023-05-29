import { z } from "zod";

import { campaignWithPlacementSchema } from "../../../components/schema/campaign";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { integrationSchema } from "../../../components/schema/integration";
import type {
  AdGroup,
  Campaign,
  Creative,
  Placement,
  Prisma,
} from "@prisma/client";

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
          provider: true,
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
          integrations: true,
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
          provider: true,
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
          integrations: true,
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
          provider: true,
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
          integrations: true,
        },
      });

      return placement;
    }),
  addIntegration: protectedProcedure
    .input(integrationSchema)
    .mutation(async ({ input }) => {
      const { placementId, ...integration } = input;
      const details = integration.details as Prisma.JsonObject;

      const placement = await prisma.placement.update({
        where: {
          id: placementId,
        },
        data: {
          integrations: {
            connectOrCreate: {
              where: {
                placementId_name: {
                  placementId,
                  name: integration.name,
                },
              },
              create: {
                ...integration,
                details,
              },
            },
          },
        },
        include: {
          integrations: true,
        },
      });

      return placement;
    }),
  updateIntegration: protectedProcedure
    .input(integrationSchema)
    .mutation(async ({ input }) => {
      const { placementId, ...integration } = input;
      const details = integration.details as Prisma.JsonObject;

      const placement = await prisma.placement.update({
        where: {
          id: placementId,
        },
        data: {
          integrations: {
            update: {
              where: {
                id: integration.id,
              },
              data: {
                ...integration,
                details,
              },
            },
          },
        },
        include: {
          integrations: true,
        },
      });

      return placement;
    }),
  removeIntegration: protectedProcedure
    .input(
      z.object({
        placementId: z.string(),
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { placementId, id } = input;
      const placement = await prisma.placement.update({
        where: {
          id: placementId,
        },
        data: {
          integrations: {
            delete: {
              id,
            },
          },
        },
        include: {
          integrations: true,
        },
      });

      return placement;
    }),
  getStats: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1) }))
    .query(async ({ input }) => {
      const { serviceId } = input;
      const creatives = await prisma.creative.findMany({
        where: {
          adGroup: {
            campaign: {
              placement: {
                serviceId,
              },
            },
          },
        },
        include: {
          adGroup: {
            include: {
              campaign: {
                include: {
                  placement: true,
                },
              },
            },
          },
        },
      });
      const creativeIds = creatives.reduce((prev, creative) => {
        prev[`${creative.id}`] = creative;
        return prev;
      }, {} as Record<string, Creative & { adGroup: AdGroup & { campaign: Campaign & { placement: Placement } } }>);

      const stats = await prisma.creativeStat.findMany({
        where: {
          creativeId: {
            in: Object.keys(creativeIds),
          },
        },
        orderBy: {
          creativeId: "desc",
        },
      });

      return stats.map((stat) => {
        return { stat, creative: creativeIds[stat.creativeId] };
      });
    }),
});
