import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { serviceConfigSchema } from "../../../components/schema/serviceConfig";

import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const serviceConfigRouter = createTRPCRouter({
  // getAll: protectedProcedure
  //   .input(z.object({ serviceId: z.string().min(1) }))
  //   .query(async ({ input }) => {
  //     const cubeConfigs = await prisma.serviceConfig.findMany({
  //       where: {
  //         serviceId: input.serviceId,
  //       },
  //       include: {
  //         service: true,
  //         cubes: {
  //           include: {
  //             segments: true,
  //           },
  //         },
  //       },
  //     });

  //     return cubeConfigs;
  //   }),

  create: protectedProcedure
    .input(serviceConfigSchema)
    .mutation(async ({ input }) => {
      const { serviceId, s3Config, builderConfig, ...others } = input;
      const s3ConfigJson = s3Config as Prisma.JsonObject;
      const builderConfigJson = builderConfig as Prisma.JsonObject;

      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          serviceConfig: {
            connectOrCreate: {
              where: {
                serviceId,
              },
              create: {
                ...others,
                s3Config: s3ConfigJson,
                builderConfig: builderConfigJson,
              },
            },
          },
        },
        include: {
          serviceConfig: {
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
  update: protectedProcedure
    .input(serviceConfigSchema)
    .mutation(async ({ input }) => {
      const { serviceId, s3Config, builderConfig, ...others } = input;
      const s3ConfigJson = s3Config as Prisma.JsonObject;
      const builderConfigJson = builderConfig as Prisma.JsonObject;

      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          serviceConfig: {
            update: {
              ...others,
              s3Config: s3ConfigJson,
              builderConfig: builderConfigJson,
            },
          },
        },
        include: {
          serviceConfig: {
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
  remove: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { serviceId } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          serviceConfig: {
            delete: true,
          },
        },
        include: {
          serviceConfig: {
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
});
