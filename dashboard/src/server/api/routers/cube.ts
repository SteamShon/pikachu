import moment from "moment";
import { z } from "zod";
import { cubeSchema } from "../../../components/schema/cube";
import { cubeHistorySchema } from "../../../components/schema/cubeHistory";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const cubeRouter = createTRPCRouter({
  create: protectedProcedure.input(cubeSchema).mutation(async ({ input }) => {
    const { providerId, ...cube } = input;
    return await prisma.cube.create({
      data: {
        ...cube,
        provider: {
          connect: {
            id: providerId,
          },
        },
      },
      include: {
        cubeHistories: true,
        provider: true,
      },
    });
  }),
  update: protectedProcedure.input(cubeSchema).mutation(async ({ input }) => {
    return await prisma.cube.update({
      where: {
        id: input.id,
      },
      data: input,
      include: {
        cubeHistories: true,
        provider: true,
      },
    });
  }),
  //TODO: Refactor all remove apis use id instead of name.
  remove: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { id } = input;
      const cube = await prisma.cube.delete({
        where: {
          id: id,
        },
      });

      return cube;
    }),
  get: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const cube = await prisma.cube.findFirst({
        where: {
          id: input.id,
        },
        include: {
          cubeHistories: true,
          provider: true,
        },
      });

      return cube;
    }),
  addNewVersion: protectedProcedure
    .input(z.object({ cubeId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const { cubeId } = input;
      const version = moment().format("YYYYMMDDHHmmss");

      const cube = await prisma.cube.update({
        where: {
          id: cubeId,
        },
        data: {
          cubeHistories: {
            create: {
              version,
              status: "CREATED",
            },
          },
        },
        include: {
          cubeHistories: true,
          provider: true,
        },
      });

      return cube;
    }),
  updateCubeHistory: protectedProcedure
    .input(cubeHistorySchema)
    .mutation(async ({ input }) => {
      const { cubeId, ...cubeHistory } = input;

      const cube = await prisma.cube.update({
        where: {
          id: cubeId,
        },
        data: {
          cubeHistories: {
            update: {
              where: {
                id: cubeHistory.id,
              },
              data: cubeHistory,
            },
          },
        },
        include: {
          cubeHistories: true,
          provider: true,
        },
      });

      return cube;
    }),
});
