import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "../../db";

export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(({}) => {
    return prisma.user.findMany();
  }),
});
