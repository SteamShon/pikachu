import { z } from "zod";

import { creativeSchema } from "../../../components/schema/creative";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { adSetSchema } from "../../../components/schema/adSet";

export const adSetRouter = createTRPCRouter({
  create: protectedProcedure.input(adSetSchema).mutation(async ({ input }) => {
    const { placementId, contentId, segmentId, ...adSet } = input;
    return await prisma.adSet.create({
      data: {
        ...adSet,
        placement: {
          connect: {
            id: placementId,
          },
        },
        content: {
          connect: {
            id: contentId,
          },
        },
        segment: {
          connect: {
            id: segmentId || undefined,
          },
        },
      },
      include: {
        placement: true,
        content: true,
        segment: true,
      },
    });
  }),
  update: protectedProcedure.input(adSetSchema).mutation(async ({ input }) => {
    const { placementId, contentId, segmentId, ...adSet } = input;
    return await prisma.adSet.update({
      where: {
        id: adSet.id,
      },
      data: {
        ...adSet,
        placement: {
          connect: {
            id: placementId,
          },
        },
        content: {
          connect: {
            id: contentId,
          },
        },
        segment: {
          connect: {
            id: segmentId || undefined,
          },
        },
      },
      include: {
        placement: true,
        content: true,
        segment: true,
      },
    });
  }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const { id } = input;
      return await prisma.adSet.delete({
        where: {
          id,
        },
        include: {
          placement: true,
          content: true,
          segment: true,
        },
      });
    }),
});
