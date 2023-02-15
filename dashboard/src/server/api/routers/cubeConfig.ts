import { z } from "zod";
import { cubeWithCubeConfigSchema } from "../../../components/schema/cube";
import { cubeConfigWithServiceSchema } from "../../../components/schema/cubeConfig";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const cubeConfigRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1) }))
    .query(async ({ input }) => {
      const cubeConfigs = await prisma.cubeConfig.findMany({
        where: {
          serviceId: input.serviceId,
        },
        include: {
          service: true,
          cubes: {
            include: {
              segments: true,
            },
          },
        },
      });

      return cubeConfigs;
    }),

  addCubeConfig: protectedProcedure
    .input(cubeConfigWithServiceSchema)
    .mutation(async ({ input }) => {
      const { serviceId, ...cubeConfigInput } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          cubeConfigs: {
            connectOrCreate: {
              where: {
                serviceId_name: {
                  serviceId,
                  name: cubeConfigInput.name,
                },
              },
              create: cubeConfigInput,
            },
          },
        },
        include: {
          cubeConfigs: {
            include: {
              cubes: {
                include: {
                  segments: true,
                },
              },
            },
          },
        },
      });

      return service;
    }),
  updateCubeConfig: protectedProcedure
    .input(cubeConfigWithServiceSchema)
    .mutation(async ({ input }) => {
      const { serviceId, ...cubeConfigInput } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          cubeConfigs: {
            update: {
              where: {
                id: cubeConfigInput.id || "",
              },
              data: cubeConfigInput,
            },
          },
        },
        include: {
          cubeConfigs: {
            include: {
              cubes: {
                include: {
                  segments: true,
                },
              },
            },
          },
        },
      });

      return service;
    }),
  removeCubeConfig: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { serviceId, name } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          cubeConfigs: {
            delete: {
              serviceId_name: {
                serviceId,
                name,
              },
            },
          },
        },
        include: {
          cubeConfigs: {
            include: {
              cubes: {
                include: {
                  segments: true,
                },
              },
            },
          },
        },
      });

      return service;
    }),
  addCube: protectedProcedure
    .input(cubeWithCubeConfigSchema)
    .mutation(async ({ input }) => {
      const { cubeConfigId, ...cubeInput } = input;
      const cubeConfig = await prisma.cubeConfig.update({
        where: {
          id: cubeConfigId,
        },
        data: {
          cubes: {
            connectOrCreate: {
              where: {
                cubeConfigId_name: {
                  cubeConfigId,
                  name: cubeInput.name,
                },
              },
              create: cubeInput,
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

      return cubeConfig;
    }),
  updateCube: protectedProcedure
    .input(cubeWithCubeConfigSchema)
    .mutation(async ({ input }) => {
      const { cubeConfigId, ...cubeInput } = input;
      const cubeConfig = await prisma.cubeConfig.update({
        where: {
          id: cubeConfigId,
        },
        data: {
          cubes: {
            update: {
              where: {
                cubeConfigId_name: {
                  cubeConfigId,
                  name: cubeInput.name,
                },
              },
              data: cubeInput,
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

      return cubeConfig;
    }),
  //TODO: Refactor all remove apis use id instead of name.
  removeCube: protectedProcedure
    .input(
      z.object({
        cubeConfigId: z.string().min(1),
        id: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { cubeConfigId, id } = input;
      const cubeConfig = await prisma.cubeConfig.update({
        where: {
          id: cubeConfigId,
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

      return cubeConfig;
    }),
});
