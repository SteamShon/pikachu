import { cubeConfigWithServiceSchema } from "../../../components/schema/cubeConfig";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "../../db";
import { z } from "zod";

export const cubeConfigRouter = createTRPCRouter({
  getCubeConfigs: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const cubeConfigs = await prisma.service.findFirst({
        where: {
          id: input.serviceId,
        },
        include: {
          cubeConfigs: {
            include: {
              cubes: true,
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
              cubes: true,
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
              cubes: true,
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
              cubes: true,
            },
          },
        },
      });

      return service;
    }),
});
