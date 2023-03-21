import { z } from "zod";
import { contentWithContentTypeSchema } from "../../../components/schema/content";

import { contentTypeSchema } from "../../../components/schema/contentType";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const contentTypeRouter = createTRPCRouter({
  addContent: protectedProcedure
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
          contentTypeInfo: true,
          contents: {
            include: {
              creatives: true,
            },
          },
        },
      });

      return contentType;
    }),
  updateContent: protectedProcedure
    .input(contentWithContentTypeSchema)
    .mutation(async ({ input, ctx }) => {
      const { contentTypeId, ...contentInput } = input;

      const contentType = await prisma.contentType.update({
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
          contentTypeInfo: true,
          contents: {
            include: {
              creatives: true,
            },
          },
        },
      });

      return contentType;
    }),
  removeContent: protectedProcedure
    .input(
      z.object({
        contentTypeId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { contentTypeId, name } = input;

      const contentType = await prisma.contentType.update({
        where: {
          id: contentTypeId,
        },

        data: {
          contents: {
            delete: {
              contentTypeId_name: {
                contentTypeId,
                name,
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
  getAll: protectedProcedure.query(({}) => {
    const contentTypes = prisma.contentType.findMany({
      include: {
        contents: true,
      },
    });

    return contentTypes;
  }),
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const contentTypes = prisma.contentType.findMany({
        where: {
          id: input.id,
        },
        include: {
          contents: true,
        },
      });

      return contentTypes;
    }),
  update: protectedProcedure
    .input(contentTypeSchema)
    .mutation(async ({ input }) => {
      const contentType = await prisma.contentType.update({
        where: {
          id: input.id,
        },
        data: input,
      });

      return contentType;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const contentType = await prisma.contentType.delete({
        where: {
          id: input.id,
        },
        include: {
          contents: true,
        },
      });
      return contentType;
    }),
});
