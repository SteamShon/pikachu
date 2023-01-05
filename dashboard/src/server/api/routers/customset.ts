import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const customsetRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        ownerId: z.string(),
        creatorId: z.string(),
        info: z.object({
          filePath: z.string(),
          config: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const customset = await ctx.prisma.customset.create({
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
});
