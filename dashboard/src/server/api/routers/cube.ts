import { z } from "zod";
import { cubeSchema } from "../../../components/schema/cube";
import { segmentWithCubeSchema } from "../../../components/schema/segment";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const cubeRouter = createTRPCRouter({
  create: protectedProcedure.input(cubeSchema).mutation(async ({ input }) => {
    const { serviceConfigId, name } = input;
    const serviceConfig = await prisma.serviceConfig.update({
      where: {
        id: serviceConfigId,
      },
      data: {
        cubes: {
          connectOrCreate: {
            where: {
              serviceConfigId_name: {
                serviceConfigId,
                name,
              },
            },
            create: input,
          },
        },
      },
      include: {
        cubes: {
          include: {
            segments: true,
          },
        },
      },
    });

    return serviceConfig;
  }),
  updateCube: protectedProcedure
    .input(cubeSchema)
    .mutation(async ({ input }) => {
      const { serviceConfigId, name } = input;
      const serviceConfig = await prisma.serviceConfig.update({
        where: {
          id: serviceConfigId,
        },
        data: {
          cubes: {
            update: {
              where: {
                serviceConfigId_name: {
                  serviceConfigId,
                  name,
                },
              },
              data: input,
            },
          },
        },
        include: {
          cubes: {
            include: {
              segments: true,
            },
          },
        },
      });

      return serviceConfig;
    }),
  //TODO: Refactor all remove apis use id instead of name.
  removeCube: protectedProcedure
    .input(
      z.object({
        serviceConfigId: z.string().min(1),
        id: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { serviceConfigId, id } = input;
      const serviceConfig = await prisma.serviceConfig.update({
        where: {
          id: serviceConfigId,
        },
        data: {
          cubes: {
            delete: {
              id,
            },
          },
        },
        include: {
          cubes: {
            include: {
              segments: true,
            },
          },
        },
      });

      return serviceConfig;
    }),
  get: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const cube = await prisma.cube.findFirst({
        where: {
          id: input.id,
        },
        include: {
          serviceConfig: {
            include: {
              service: true,
            },
          },
          segments: true,
        },
      });

      return cube;
    }),

  addSegment: protectedProcedure
    .input(segmentWithCubeSchema)
    .mutation(async ({ input }) => {
      const { cubeId, ...segmentInput } = input;
      const cube = await prisma.cube.update({
        where: {
          id: cubeId,
        },
        data: {
          segments: {
            connectOrCreate: {
              where: {
                cubeId_name: {
                  cubeId,
                  name: segmentInput.name,
                },
              },
              create: segmentInput,
            },
          },
        },
        include: {
          serviceConfig: true,
          segments: true,
        },
      });

      return cube;
    }),
  updateSegment: protectedProcedure
    .input(segmentWithCubeSchema)
    .mutation(async ({ input }) => {
      const { cubeId, ...segmentInput } = input;
      const cube = await prisma.cube.update({
        where: {
          id: cubeId,
        },
        data: {
          segments: {
            update: {
              where: {
                id: segmentInput.id || "",
              },
              data: segmentInput,
            },
          },
        },
        include: {
          serviceConfig: true,
          segments: true,
        },
      });

      return cube;
    }),
  removeSegment: protectedProcedure
    .input(
      z.object({
        cubeId: z.string().min(1),
        id: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { cubeId, id } = input;
      const cube = await prisma.cube.update({
        where: {
          id: cubeId,
        },
        data: {
          segments: {
            delete: {
              id,
            },
          },
        },
        include: {
          serviceConfig: true,
          segments: true,
        },
      });

      return cube;
    }),
});
