import { z } from "zod";
import { cubeSchema } from "../../../components/schema/cube";
import { segmentWithCubeSchema } from "../../../components/schema/segment";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const cubeRouter = createTRPCRouter({
  create: protectedProcedure.input(cubeSchema).mutation(async ({ input }) => {
    const cube = await prisma.cube.create({
      data: input,
      include: {
        serviceConfig: true,
        segments: true,
      },
    });

    return cube;
  }),
  update: protectedProcedure.input(cubeSchema).mutation(async ({ input }) => {
    const cube = await prisma.cube.update({
      where: {
        id: input.id,
      },
      data: input,
      include: {
        serviceConfig: true,
        segments: true,
      },
    });

    return cube;
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
          serviceConfig: {
            include: {
              service: true,
            },
          },
          segments: true,
        },
      });

      return cube;
    }),

  addSegment: protectedProcedure
    .input(segmentWithCubeSchema)
    .mutation(async ({ input }) => {
      const { cubeId, ...segmentInput } = input;
      const cube = await prisma.cube.update({
        where: {
          id: cubeId,
        },
        data: {
          segments: {
            connectOrCreate: {
              where: {
                cubeId_name: {
                  cubeId,
                  name: segmentInput.name,
                },
              },
              create: segmentInput,
            },
          },
        },
        include: {
          serviceConfig: true,
          segments: true,
        },
      });

      return cube;
    }),
  updateSegment: protectedProcedure
    .input(segmentWithCubeSchema)
    .mutation(async ({ input }) => {
      const { cubeId, ...segmentInput } = input;
      const cube = await prisma.cube.update({
        where: {
          id: cubeId,
        },
        data: {
          segments: {
            update: {
              where: {
                id: segmentInput.id || "",
              },
              data: segmentInput,
            },
          },
        },
        include: {
          serviceConfig: true,
          segments: true,
        },
      });

      return cube;
    }),
  removeSegment: protectedProcedure
    .input(
      z.object({
        cubeId: z.string().min(1),
        id: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { cubeId, id } = input;
      const cube = await prisma.cube.update({
        where: {
          id: cubeId,
        },
        data: {
          segments: {
            delete: {
              id,
            },
          },
        },
        include: {
          serviceConfig: true,
          segments: true,
        },
      });

      return cube;
    }),
});
