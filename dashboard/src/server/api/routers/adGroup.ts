import { z } from "zod";

import { creativeSchema } from "../../../components/schema/creative";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const adGroupRouter = createTRPCRouter({
  addCreative: protectedProcedure
    .input(
      creativeSchema.extend({
        adGroupId: z.string().min(1),
        contentId: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { adGroupId, contentId, ...creativeInput } = input;
      const adGroup = await prisma.adGroup.update({
        where: {
          id: adGroupId,
        },
        data: {
          creatives: {
            connectOrCreate: {
              where: {
                adGroupId_name: {
                  adGroupId: adGroupId,
                  name: creativeInput.name,
                },
              },
              create: {
                ...creativeInput,
                content: {
                  connect: {
                    id: contentId,
                  },
                },
              },
            },
          },
        },
        include: {
          campaign: {
            include: {
              placement: {
                include: {
                  contentType: true,
                  service: true,
                },
              },
            },
          },
          creatives: {
            include: {
              content: true,
            },
          },
        },
      });

      return adGroup;
    }),
  updateCreative: protectedProcedure
    .input(
      creativeSchema.extend({
        adGroupId: z.string().min(1),
        contentId: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { adGroupId, contentId, ...creativeInput } = input;
      const adGroup = await prisma.adGroup.update({
        where: {
          id: adGroupId,
        },
        data: {
          creatives: {
            update: {
              where: {
                id: creativeInput.id || "",
              },
              data: {
                ...creativeInput,
                content: {
                  connect: {
                    id: contentId,
                  },
                },
              },
            },
          },
        },
        include: {
          campaign: {
            include: {
              placement: {
                include: {
                  contentType: true,
                  service: true,
                },
              },
            },
          },
          creatives: {
            include: {
              content: true,
            },
          },
        },
      });

      return adGroup;
    }),
  removeCreative: protectedProcedure
    .input(z.object({ adGroupId: z.string(), name: z.string() }))
    .mutation(async ({ input }) => {
      const { adGroupId, name } = input;
      const adGroup = await prisma.adGroup.update({
        where: {
          id: adGroupId,
        },
        data: {
          creatives: {
            delete: {
              adGroupId_name: {
                adGroupId,
                name,
              },
            },
          },
        },
        include: {
          campaign: {
            include: {
              placement: {
                include: {
                  contentType: true,
                  service: true,
                },
              },
            },
          },
          creatives: {
            include: {
              content: true,
            },
          },
        },
      });

      return adGroup;
    }),
});
