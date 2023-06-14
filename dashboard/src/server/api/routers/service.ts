import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { placementSchema } from "../../../components/schema/placement";
import { serviceSchema } from "../../../components/schema/service";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const getIncludes = {
  placements: {
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
      integrations: true,
    },
  },
  contentTypes: {
    include: {
      contents: {
        include: {
          creatives: true,
        },
      },
    },
  },
  customsets: {
    include: {
      createdBy: true,
    },
  },
  integrations: {
    include: {
      service: true,
      placements: true,
    },
  },
};
export const serviceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(serviceSchema)
    .mutation(async ({ input }) => {
      const detailsJson = input.details as Prisma.JsonObject;

      return await prisma.service.create({
        data: {
          ...input,
          details: detailsJson,
        },
      });
    }),
  update: protectedProcedure
    .input(serviceSchema)
    .mutation(async ({ input }) => {
      const detailsJson = input.details as Prisma.JsonObject;

      return await prisma.service.update({
        where: {
          id: input.id,
        },
        data: {
          ...input,
          details: detailsJson,
        },
      });
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const service = await prisma.service.delete({
        where: {
          id: input.id,
        },
        /*
        include: {
          placementGroups: {
            include: {
              placements: true,
            },
          },
        },
        */
      });

      return service;
    }),

  getAllOnlyServices: protectedProcedure.query(async ({}) => {
    return await prisma.service.findMany({});
  }),
  getOnlyService: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
      })
    )
    .query(({ input }) => {
      if (!input?.id) return null;

      return prisma.service.findUnique({ where: { id: input.id } });
    }),
  get: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
      })
    )
    .query(({ input }) => {
      if (!input.id) return null;

      return prisma.service.findFirst({
        where: {
          id: input.id,
        },
        include: getIncludes,
      });
    }),
});
