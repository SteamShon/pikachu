import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "../../db";
import {
  campaignSchema,
  campaignWithPlacementSchema,
} from "../../../components/schema/campaign";
import { placementSchema } from "../../../components/schema/placement";

export const placementRouter = createTRPCRouter({
  update: protectedProcedure
    .input(placementSchema)
    .mutation(async ({ input, ctx }) => {
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
    .mutation(async ({ input, ctx }) => {
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
          placementGroup: {
            include: {
              service: true,
            },
          },
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
    .mutation(async ({ input, ctx }) => {
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
          placementGroup: {
            include: {
              service: true,
            },
          },
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
    .mutation(async ({ input, ctx }) => {
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
          placementGroup: {
            include: {
              service: true,
            },
          },
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
