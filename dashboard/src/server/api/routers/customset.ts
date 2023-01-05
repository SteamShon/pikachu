import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "../../db";
import { customsetSchema } from "../../../components/schema/customset";

export const customsetRouter = createTRPCRouter({
  create: publicProcedure.input(customsetSchema).mutation(async ({ input }) => {
    const customset = await prisma.customset.create({
      data: {
        name: input.name,
        description: input.description,
        ownerId: "1",
        creatorId: "1",
        info: {
          create: {
            ...input.info,
          },
        },
      },
    });

    return customset;
  }),
  getAll: publicProcedure.query(({}) => {
    return prisma.customset.findMany();
  }),
});
