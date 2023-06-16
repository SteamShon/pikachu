import { z } from "zod";
import { contentWithContentTypeSchema } from "../../../components/schema/content";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const contentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(contentWithContentTypeSchema)
    .mutation(async ({ input, ctx }) => {
      const { contentTypeId, ...contentInput } = input;

      const contentType = await prisma.contentType.update({
        where: {
          id: contentTypeId,
        },

        data: {
          contents: {
            connectOrCreate: {
              where: {
                contentTypeId_name: {
                  contentTypeId: contentTypeId,
                  name: contentInput.name,
                },
              },
              create: {
                ...contentInput,
                values: JSON.stringify(contentInput.values),
                createdBy: {
                  connect: {
                    id: ctx.session?.user?.id,
                  },
                },
              },
            },
          },
        },

        include: {
          contents: {
            include: {
              creatives: true,
            },
          },
        },
      });

      return contentType;
    }),
  update: protectedProcedure
    .input(contentWithContentTypeSchema)
    .mutation(async ({ input, ctx }) => {
      const { contentTypeId, ...contentInput } = input;

      return await prisma.contentType.update({
        where: {
          id: contentTypeId,
        },

        data: {
          contents: {
            update: {
              where: {
                id: contentInput.id || "",
              },
              data: {
                ...contentInput,
                values: JSON.stringify(contentInput.values),
                createdBy: {
                  connect: {
                    id: ctx.session?.user?.id,
                  },
                },
              },
            },
          },
        },

        include: {
          contents: {
            include: {
              creatives: true,
            },
          },
        },
      });
    }),
  remove: protectedProcedure
    .input(
      z.object({
        contentTypeId: z.string(),
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { contentTypeId, id } = input;

      const contentType = await prisma.contentType.update({
        where: {
          id: contentTypeId,
        },

        data: {
          contents: {
            delete: {
              id,
            },
          },
        },

        include: {
          contents: {
            include: {
              creatives: true,
            },
          },
        },
      });

      return contentType;
    }),
});
