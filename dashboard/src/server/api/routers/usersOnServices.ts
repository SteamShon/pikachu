import { z } from "zod";
import { usersOnServicesSchema } from "../../../components/schema/usersOnServices";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const usersOnServicesRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ input }) => {
      const { userId } = input;
      if (!userId) return [];

      const usersOnServices = await prisma.usersOnServices.findMany({
        where: {
          userId,
        },
        include: {
          user: true,
          service: true,
        },
      });

      return usersOnServices;
    }),
  create: protectedProcedure
    .input(usersOnServicesSchema)
    .mutation(async ({ input }) => {
      const usersOnServices = await prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          services: {
            connectOrCreate: {
              where: {
                serviceId_userId: {
                  serviceId: input.serviceId,
                  userId: input.userId,
                },
              },
              create: {
                serviceId: input.serviceId,
                role: input.role,
              },
            },
          },
        },
        include: {
          services: {
            include: {
              service: true,
              user: true,
            },
          },
        },
      });

      return usersOnServices;
    }),
  update: protectedProcedure
    .input(usersOnServicesSchema)
    .mutation(async ({ input }) => {
      const usersOnServices = await prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          services: {
            update: {
              where: {
                serviceId_userId: {
                  userId: input.userId,
                  serviceId: input.serviceId,
                },
              },
              data: input,
            },
          },
        },
        include: {
          services: {
            include: {
              service: true,
              user: true,
            },
          },
        },
      });

      return usersOnServices;
    }),
  delete: protectedProcedure
    .input(z.object({ serviceId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const { serviceId, userId } = input;
      const usersOnServices = await prisma.usersOnServices.delete({
        where: {
          serviceId_userId: {
            serviceId,
            userId,
          },
        },
      });

      return usersOnServices;
    }),
});
