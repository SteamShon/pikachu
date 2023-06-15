import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { providerSchema } from "../../../components/schema/provider";

export const providerRouter = createTRPCRouter({
  create: protectedProcedure
    .input(providerSchema)
    .mutation(async ({ input }) => {
      const detailsJson = input.details as Prisma.JsonObject;
      const provider = await prisma.provider.create({
        data: {
          ...input,
          details: detailsJson,
        },
      });

      return provider;
    }),
  update: protectedProcedure
    .input(providerSchema)
    .mutation(async ({ input }) => {
      const { id, ...provider } = input;
      const detailsJson = input.details as Prisma.JsonObject;
      return await prisma.provider.update({
        where: {
          id,
        },
        data: {
          ...provider,
          details: detailsJson,
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
      return await prisma.provider.delete({
        where: {
          id,
        },
      });
    }),
});
