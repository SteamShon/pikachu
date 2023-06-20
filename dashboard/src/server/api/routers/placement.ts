import { z } from "zod";

import type { AdGroup, Campaign, Creative, Placement } from "@prisma/client";
import { campaignWithPlacementSchema } from "../../../components/schema/campaign";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { placementSchema } from "../../../components/schema/placement";
import { getIncludes } from "./service";

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
          integrations: {
            include: {
              provider: true,
            },
          },
          contentType: {
            include: {
              contents: true,
            },
          },
        },
      });

      return placements;
    }),
  create: protectedProcedure
    .input(placementSchema)
    .mutation(async ({ input }) => {
      const { serviceId, contentTypeId, integrationIds, ...placement } = input;
      return await prisma.placement.create({
        data: {
          ...placement,
          contentType: {
            connect: {
              id: contentTypeId || "",
            },
          },
          service: {
            connect: {
              id: serviceId || "",
            },
          },
          integrations: {
            connect: integrationIds.map((id) => {
              return { id };
            }),
          },
        },
        include: {
          contentType: true,
          campaigns: {
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
          integrations: {
            include: {
              provider: true,
              segments: true,
            },
          },
          adSets: {
            include: {
              segment: true,
              content: true,
            },
          },
        },
      });
    }),
  update: protectedProcedure
    .input(placementSchema)
    .mutation(async ({ input }) => {
      const { serviceId, contentTypeId, integrationIds, ...placement } = input;
      const removes = prisma.placement.update({
        where: {
          id: placement.id,
        },
        data: {
          integrations: {
            set: [],
          },
        },
      });
      const update = prisma.placement.update({
        where: {
          id: placement.id,
        },
        data: {
          ...placement,
          contentType: {
            connect: {
              id: contentTypeId || "",
            },
          },
          service: {
            connect: {
              id: serviceId || "",
            },
          },
          integrations: {
            connect: integrationIds.map((id) => {
              return { id };
            }),
          },
        },
        include: {
          contentType: true,
          campaigns: {
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
          integrations: {
            include: {
              provider: true,
              segments: true,
            },
          },
          adSets: {
            include: {
              segment: true,
              content: true,
            },
          },
        },
      });
      const [, updated] = await prisma.$transaction([removes, update]);
      return updated;
    }),
  remove: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { serviceId, id } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          placements: {
            delete: {
              id,
            },
          },
        },
        include: getIncludes,
      });

      return service;
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
          integrations: {
            include: {
              provider: true,
              segments: true,
            },
          },
          adSets: {
            include: {
              segment: true,
              content: true,
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
          integrations: {
            include: {
              provider: true,
              segments: true,
            },
          },
          adSets: {
            include: {
              segment: true,
              content: true,
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
          integrations: {
            include: {
              provider: true,
              segments: true,
            },
          },
          adSets: {
            include: {
              segment: true,
              content: true,
            },
          },
        },
      });

      return placement;
    }),
  // addIntegrations: protectedProcedure
  //   .input(integrationsSchema)
  //   .mutation(async ({ input }) => {
  //     const { placementId, integrations: integrationsInput } = input;
  //     const integrations = integrationsInput.map((integration) => {
  //       const details = integration.details as Prisma.JsonObject;
  //       return { ...integration, details };
  //     });
  //     const deletes = prisma.placement.update({
  //       where: {
  //         id: placementId,
  //       },
  //       data: {
  //         integrations: {
  //           set: [],
  //         },
  //       },
  //     });
  //     const inserts = prisma.placement.update({
  //       where: {
  //         id: placementId,
  //       },
  //       data: {
  //         integrations: {
  //           create: integrations.map((integration) => {
  //             return {
  //               ...integration,
  //             };
  //           }),
  //         },
  //       },
  //       include: {
  //         integrations: true,
  //       },
  //     });

  //     const [, inserted] = await prisma.$transaction([deletes, inserts]);
  //     return inserted;
  //   }),

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
