import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({}) => {
    return prisma.user.findMany();
  }),
  getServices: protectedProcedure.query(async ({ ctx }) => {
    const services = await prisma.usersOnServices.findMany({
      where: {
        user: {
          id: ctx.session.user.id,
        },
      },
      include: {
        user: true,
        service: true,
      },
    });

    return services;
  }),
});
