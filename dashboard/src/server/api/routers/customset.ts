import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "../../db";
import { customsetWithServiceSchema } from "../../../components/schema/customset";
import type { Prisma } from "@prisma/client";

export const customsetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(customsetWithServiceSchema)
    .mutation(async ({ input, ctx }) => {
      const detailsJson = input.details as Prisma.JsonObject;
      const { serviceId, ...customset } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          customsets: {
            connectOrCreate: {
              where: {
                serviceId_name: {
                  serviceId: serviceId,
                  name: customset.name,
                },
              },
              create: {
                ...customset,
                createdBy: {
                  connect: {
                    id: ctx.session?.user?.id,
                  },
                },
                details: detailsJson,
              },
            },
          },
        },
        include: {
          customsets: {
            include: {
              createdBy: true,
            },
          },
        },
      });

      return service;
    }),
  update: protectedProcedure
    .input(customsetWithServiceSchema)
    .mutation(async ({ input, ctx }) => {
      const detailsJson = input.details as Prisma.JsonObject;
      const { serviceId, ...customset } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          customsets: {
            update: {
              where: {
                id: customset.id || "",
              },
              data: {
                ...customset,
                details: detailsJson,
                createdBy: {
                  connect: {
                    id: ctx.session?.user?.id,
                  },
                },
              },
            },
          },
        },
        include: {
          customsets: {
            include: {
              createdBy: true,
            },
          },
        },
      });

      return service;
    }),
  remove: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { serviceId, name } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          customsets: {
            delete: {
              serviceId_name: {
                serviceId,
                name,
              },
            },
          },
        },
        include: {
          customsets: {
            include: {
              createdBy: true,
            },
          },
        },
      });

      return service;
    }),
});
