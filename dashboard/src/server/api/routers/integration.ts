import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { integrationSchema } from "../../../components/schema/integration";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";

export const integrationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(integrationSchema)
    .mutation(async ({ input }) => {
      const detailsJson = input.details as Prisma.JsonObject;
      const integration = await prisma.integration.create({
        data: {
          ...input,
          details: detailsJson,
        },
        include: {
          provider: true,
          segments: true,
        },
      });

      return integration;
    }),
  update: protectedProcedure
    .input(integrationSchema)
    .mutation(async ({ input }) => {
      const { id, ...integration } = input;
      const detailsJson = input.details as Prisma.JsonObject;
      return await prisma.integration.update({
        where: {
          id,
        },
        data: {
          ...integration,
          details: detailsJson,
        },
        include: {
          provider: true,
          segments: true,
        },
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { id } = input;
      return await prisma.integration.delete({
        where: {
          id,
        },
        include: {
          provider: true,
          segments: true,
        },
      });
    }),
  placements: protectedProcedure
    .input(z.object({ integrationId: z.string().optional() }))
    .query(async ({ input }) => {
      const { integrationId } = input;
      if (!integrationId) return [];

      return await prisma.placement.findMany({
        where: {
          integrations: {
            some: {
              id: integrationId,
            },
          },
        },
        include: {
          contentType: {
            include: {
              contents: true,
            },
          },
          adSets: {
            include: {
              content: true,
              segment: true,
            },
          },
        },
      });
    }),
  // addIntegrations: protectedProcedure
  //   .input(integrationsSchema)
  //   .mutation(async ({ input }) => {
  //     const { placementId, integrations: integrationsInput } = input;
  //     const integrations = integrationsInput.map((integration) => {
  //       const details = integration.details as Prisma.JsonObject;
  //       return { ...integration, details };
  //     });
  //     const deletes = prisma.placement.update({
  //       where: {
  //         id: placementId,
  //       },
  //       data: {
  //         integrations: {
  //           set: [],
  //         },
  //       },
  //     });
  //     const inserts = prisma.placement.update({
  //       where: {
  //         id: placementId,
  //       },
  //       data: {
  //         integrations: {
  //           create: integrations.map((integration) => {
  //             return {
  //               ...integration,
  //             };
  //           }),
  //         },
  //       },
  //       include: {
  //         integrations: true,
  //       },
  //     });
  //     const [, inserted] = await prisma.$transaction([deletes, inserts]);
  //     return inserted;
  //   }),
});
