import { z } from "zod";

import { jobSchema } from "../../../components/schema/job";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { Prisma } from "@prisma/client";

export const jobRouter = createTRPCRouter({
  create: protectedProcedure.input(jobSchema).mutation(async ({ input }) => {
    const { placementId, integrationId, ...job } = input;
    const detailsJson = job.details as Prisma.JsonObject;
    return await prisma.job.create({
      data: {
        ...job,
        details: detailsJson,
        placement: {
          connect: {
            id: placementId,
          },
        },
        integration: {
          connect: {
            id: integrationId,
          },
        },
      },
    });
  }),
  update: protectedProcedure.input(jobSchema).mutation(async ({ input }) => {
    const { placementId, integrationId, ...job } = input;
    const detailsJson = job.details as Prisma.JsonObject;
    return await prisma.job.update({
      where: {
        id: job.id,
      },
      data: {
        ...job,
        details: detailsJson,
        placement: {
          connect: {
            id: placementId,
          },
        },
        integration: {
          connect: {
            id: integrationId,
          },
        },
      },
    });
  }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const { id } = input;
      return await prisma.job.delete({
        where: {
          id,
        },
      });
    }),
});
