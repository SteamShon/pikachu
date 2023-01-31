import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "../../db";
import { customsetSchema } from "../../../components/schema/customset";

export const customsetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(customsetSchema)
    .mutation(async ({ input, ctx }) => {
      const customset = await prisma.customset.create({
        data: {
          name: input.name,
          description: input.description,
          createdBy: {
            connect: {
              id: ctx.session?.user?.id,
            },
          },
          customsetInfo: {
            create: {
              ...input.customsetInfo,
            },
          },
        },
        include: {
          customsetInfo: true,
          createdBy: true,
        },
      });

      return customset;
    }),
  getAll: protectedProcedure.query(({}) => {
    return prisma.customset.findMany({
      include: {
        customsetInfo: true,
        createdBy: true,
      },
    });
  }),
  get: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(({ input }) => {
      return prisma.customset.findFirst({
        where: {
          id: input.id,
        },
        include: {
          customsetInfo: true,
          createdBy: true,
        },
      });
    }),
  update: protectedProcedure
    .input(customsetSchema)
    .mutation(async ({ input, ctx }) => {
      const customset = await prisma.customset.update({
        where: {
          id: input?.id,
        },
        data: {
          name: input.name,
          description: input.description,
          createdBy: {
            update: {
              id: ctx.session?.user?.id,
            },
          },
          customsetInfo: {
            update: {
              ...input.customsetInfo,
            },
          },
        },
        include: {
          customsetInfo: true,
          createdBy: true,
        },
      });

      return customset;
    }),
  deleteMany: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input }) => {
      //TODO: prisma deleteMany do not return delete rows.
      //Once https://github.com/prisma/prisma/issues/8131 has been resolved, then
      //we can change this into deleteMany
      const customsets = await prisma.$transaction(
        input.map((id) =>
          prisma.customset.delete({
            where: {
              id: id,
            },
          })
        )
      );

      return customsets;
    }),
});
