import { z } from "zod";

import { segmentSchema } from "../../../components/schema/segment";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const segmentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(segmentSchema)
    .mutation(async ({ input }) => {
      const { integrationId, ...segment } = input;
      return await prisma.segment.create({
        data: {
          ...segment,
          integration: {
            connect: {
              id: integrationId,
            },
          },
        },
        include: {
          integration: true,
        },
      });
    }),
  update: protectedProcedure
    .input(segmentSchema)
    .mutation(async ({ input }) => {
      const { integrationId, ...segment } = input;
      return await prisma.segment.update({
        where: {
          id: segment.id,
        },
        data: {
          ...segment,
          integration: {
            connect: {
              id: integrationId,
            },
          },
        },
        include: {
          integration: {
            include: {
              provider: true,
              service: true,
            },
          },
        },
      });
    }),
  remove: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { id } = input;

      return await prisma.segment.delete({
        where: {
          id,
        },
        include: {
          integration: {
            include: {
              provider: true,
              service: true,
            },
          },
        },
      });
    }),
});
