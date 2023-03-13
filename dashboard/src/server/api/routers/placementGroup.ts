import { z } from "zod";
import { placementWithPlacementGroupSchema } from "../../../components/schema/placement";
import { placementGroupSchema } from "../../../components/schema/placementGroup";

import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const placementGroupRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(async ({ input }) => {
      const placementGroups = await prisma.placementGroup.findMany({
        where: {
          serviceId: input.serviceId,
        },
        include: {
          cube: {
            include: {
              cubeConfig: true,
            },
          },
        },
      });
      return placementGroups;
    }),
  create: protectedProcedure
    .input(placementGroupSchema)
    .mutation(async ({ input }) => {
      const placementGroup = await prisma.placementGroup.create({
        data: input,
        include: {
          placements: true,
        },
      });

      return placementGroup;
    }),
  update: protectedProcedure
    .input(placementGroupSchema)
    .mutation(async ({ input }) => {
      const { ...placementGroupInput } = input;
      const placementGroup = await prisma.placementGroup.update({
        where: {
          id: placementGroupInput.id,
        },
        data: placementGroupInput,
        include: {
          service: true,
          placements: {
            orderBy: {
              updatedAt: "desc",
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
            },
          },
        },
      });

      return placementGroup;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const placementGroup = await prisma.placementGroup.delete({
        where: {
          id: input.id,
        },
      });

      return placementGroup;
    }),
  addPlacement: protectedProcedure
    .input(placementWithPlacementGroupSchema)
    .mutation(async ({ input }) => {
      const { placementGroupId, ...placementInput } = input;

      const placementGroup = await prisma.placementGroup.update({
        where: {
          id: placementGroupId,
        },
        data: {
          placements: {
            connectOrCreate: {
              where: {
                placementGroupId_name: {
                  placementGroupId: placementGroupId,
                  name: placementInput.name,
                },
              },
              create: placementInput,
            },
          },
        },
        include: {
          service: true,
          placements: {
            orderBy: {
              updatedAt: "desc",
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
            },
          },
        },
      });

      return placementGroup;
    }),
  updatePlacement: protectedProcedure
    .input(placementWithPlacementGroupSchema)
    .mutation(async ({ input }) => {
      const { placementGroupId, ...placementInput } = input;

      const placementGroup = await prisma.placementGroup.update({
        where: {
          id: placementGroupId,
        },
        data: {
          placements: {
            update: {
              where: {
                id: placementInput.id || "",
              },
              data: placementInput,
            },
          },
        },
        include: {
          service: true,
          placements: {
            orderBy: {
              updatedAt: "desc",
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
            },
          },
        },
      });

      return placementGroup;
    }),
  removePlacement: protectedProcedure
    .input(
      z.object({
        placementGroupId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { placementGroupId, name } = input;
      const placementGroup = await prisma.placementGroup.update({
        where: {
          id: placementGroupId,
        },
        data: {
          placements: {
            delete: {
              placementGroupId_name: {
                placementGroupId,
                name,
              },
            },
          },
        },
        include: {
          service: true,
          placements: {
            orderBy: {
              updatedAt: "desc",
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
            },
          },
        },
      });

      return placementGroup;
    }),
});
