import { z } from "zod";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { contentTypeSchema } from "../../../components/schema/contentType";
import type { Prisma } from "@prisma/client";
import { getIncludes } from "./service";

export const contentTypeRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1) }))
    .query(({ input }) => {
      const { serviceId } = input;
      const contentTypes = prisma.contentType.findMany({
        where: {
          serviceId,
        },
      });

      return contentTypes;
    }),

  create: protectedProcedure
    .input(contentTypeSchema)
    .mutation(async ({ input }) => {
      const { serviceId, ...contentType } = input;
      const detailsJson = contentType.details as Prisma.JsonObject;

      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          contentTypes: {
            connectOrCreate: {
              where: {
                serviceId_name: {
                  serviceId,
                  name: contentType.name,
                },
              },
              create: {
                ...contentType,
                details: detailsJson,
              },
            },
          },
        },
        include: getIncludes,
      });

      return service;
    }),
  update: protectedProcedure
    .input(contentTypeSchema)
    .mutation(async ({ input }) => {
      const { serviceId, ...contentType } = input;
      const detailsJson = contentType.details as Prisma.JsonObject;

      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          contentTypes: {
            update: {
              where: {
                id: contentType.id,
              },
              data: {
                ...contentType,
                details: detailsJson,
              },
            },
          },
        },
        include: getIncludes,
      });

      return service;
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
          contentTypes: {
            delete: {
              id,
            },
          },
        },
        include: getIncludes,
      });

      return service;
    }),
});
