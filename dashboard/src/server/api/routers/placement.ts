import { z } from "zod";

import { campaignWithPlacementSchema } from "../../../components/schema/campaign";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { integrationSchema } from "../../../components/schema/integration";
import type { Prisma } from "@prisma/client";

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
  addIntegration: protectedProcedure
    .input(integrationSchema)
    .mutation(async ({ input }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { integrationInfo, ...integrationInput } = input;
      const { placementId, ...integration } = integrationInput;

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
              },
            },
          },
        },
        include: {
          integrations: {
            include: {
              integrationInfo: true,
            },
          },
        },
      });

      return placement;
    }),
  updateIntegration: protectedProcedure
    .input(integrationSchema)
    .mutation(async ({ input }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { integrationInfo, ...integrationInput } = input;
      const { placementId, ...integration } = integrationInput;

      const integrationInfoJson = {
        id: integrationInfo?.id,
        details: integrationInfo?.details as Prisma.JsonObject,
      };

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
                integrationInfo: {
                  upsert: {
                    update: integrationInfoJson,
                    create: integrationInfoJson,
                  },
                },
              },
            },
          },
        },
        include: {
          integrations: {
            include: {
              integrationInfo: true,
            },
          },
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
          integrations: {
            include: {
              integrationInfo: true,
            },
          },
        },
      });

      return placement;
    }),
});
