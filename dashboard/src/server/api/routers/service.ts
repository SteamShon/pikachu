import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { contentTypeSchema } from "../../../components/schema/contentType";
import { customsetWithServiceSchema } from "../../../components/schema/customset";
import { placementSchema } from "../../../components/schema/placement";

import { serviceSchema } from "../../../components/schema/service";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { providerSchema } from "../../../components/schema/provider";

export const getIncludes = {
  placements: {
    include: {
      contentType: true,
      campaigns: {
        include: {
          adGroups: {
            include: {
              creatives: {
                include: {
                  content: true,
                },
              },
            },
          },
        },
      },
      integrations: {
        include: {
          integrationInfo: true,
        },
      },
    },
  },
  contentTypes: {
    include: {
      contentTypeInfo: true,
      contents: {
        include: {
          creatives: true,
        },
      },
    },
  },
  customsets: {
    include: {
      customsetInfo: true,
      createdBy: true,
    },
  },
  serviceConfig: {
    include: {
      cubes: {
        include: {
          cubeHistories: true,
        },
      },
    },
  },
  providers: true,
};
export const serviceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(serviceSchema)
    .mutation(async ({ input }) => {
      const { serviceConfig, ...service } = input;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { serviceId, ...serviceConfigInput } = {
        ...serviceConfig,
        s3Config: serviceConfig?.s3Config as Prisma.JsonObject,
        builderConfig: serviceConfig?.builderConfig as Prisma.JsonObject,
      };
      return await prisma.service.create({
        data: {
          ...service,
          serviceConfig: {
            create: serviceConfigInput,
          },
        },
        include: {
          serviceConfig: true,
        },
      });
    }),
  update: protectedProcedure
    .input(serviceSchema)
    .mutation(async ({ input }) => {
      const { serviceConfig, ...service } = input;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { serviceId, ...serviceConfigInput } = {
        ...serviceConfig,
        s3Config: serviceConfig?.s3Config as Prisma.JsonObject,
        builderConfig: serviceConfig?.builderConfig as Prisma.JsonObject,
      };
      return await prisma.service.update({
        where: {
          id: service.id,
        },
        data: {
          ...service,
          serviceConfig: {
            upsert: {
              update: serviceConfigInput,
              create: serviceConfigInput,
            },
          },
        },
        include: {
          serviceConfig: true,
        },
      });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const service = await prisma.service.delete({
        where: {
          id: input.id,
        },
        /*
        include: {
          placementGroups: {
            include: {
              placements: true,
            },
          },
        },
        */
      });

      return service;
    }),
  deleteMany: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input }) => {
      //TODO: prisma deleteMany do not return delete rows.
      //Once https://github.com/prisma/prisma/issues/8131 has been resolved, then
      //we can change this into deleteMany
      const services = await prisma.$transaction(
        input.map((id) =>
          prisma.service.delete({
            where: {
              id: id,
            },
          })
        )
      );

      return services;
    }),
  getAllOnlyServices: protectedProcedure.query(async ({}) => {
    return await prisma.service.findMany({
      include: {
        serviceConfig: true,
      },
    });
  }),
  getAll: protectedProcedure.query(async ({}) => {
    const services = await prisma.service.findMany({
      include: {
        placements: true,
        contentTypes: {
          include: {
            contentTypeInfo: true,
            contents: true,
          },
        },
      },
    });

    return services;
  }),
  getOnlyService: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(({ input }) => {
      return prisma.service.findUnique({ where: { id: input.id } });
    }),
  get: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(({ input }) => {
      return prisma.service.findFirst({
        where: {
          id: input.id,
        },
        include: getIncludes,
      });
    }),

  addPlacement: protectedProcedure
    .input(placementSchema)
    .mutation(async ({ input }) => {
      const { serviceId, ...placement } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          placements: {
            connectOrCreate: {
              where: {
                serviceId_name: {
                  serviceId: serviceId,
                  name: placement.name,
                },
              },
              create: placement,
            },
          },
        },
        include: getIncludes,
      });

      return service;
    }),
  updatePlacement: protectedProcedure
    .input(placementSchema)
    .mutation(async ({ input }) => {
      const { serviceId, ...placement } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          placements: {
            update: {
              where: {
                id: placement.id,
              },
              data: placement,
            },
          },
        },
        include: getIncludes,
      });

      return service;
    }),
  removePlacement: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { serviceId, id } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          placements: {
            delete: {
              id,
            },
          },
        },
        include: getIncludes,
      });

      return service;
    }),

  addContentType: protectedProcedure
    .input(contentTypeSchema)
    .mutation(async ({ input }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { contentTypeInfo, ...contentTypeInput } = input;
      const { serviceId, ...contentType } = contentTypeInput;

      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          contentTypes: {
            connectOrCreate: {
              where: {
                serviceId_name: {
                  serviceId: serviceId,
                  name: contentType.name,
                },
              },
              create: {
                ...contentType,
                // contentTypeInfo: {
                //   connectOrCreate: {
                //     where: {
                //       id: contentTypeInfo?.id,
                //     },
                //     create: contentTypeInfoJson,
                //   },
                // },
              },
            },
          },
        },
        include: getIncludes,
      });

      return service;
    }),
  updateContentType: protectedProcedure
    .input(contentTypeSchema)
    .mutation(async ({ input }) => {
      const { contentTypeInfo, ...contentTypeInput } = input;
      const { serviceId, ...contentType } = contentTypeInput;
      const contentTypeInfoJson = {
        id: contentTypeInfo?.id,
        details: contentTypeInfo?.details as Prisma.JsonObject,
      };

      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          contentTypes: {
            update: {
              where: {
                id: contentType.id,
              },
              data: {
                ...contentType,
                contentTypeInfo: {
                  upsert: {
                    update: contentTypeInfoJson,
                    create: contentTypeInfoJson,
                  },
                },
              },
            },
          },
        },
        include: getIncludes,
      });

      return service;
    }),
  removeContentType: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { serviceId, id } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          contentTypes: {
            delete: {
              id,
            },
          },
        },
        include: getIncludes,
      });

      return service;
    }),
  addCustomset: protectedProcedure
    .input(customsetWithServiceSchema)
    .mutation(async ({ input, ctx }) => {
      const { serviceId, ...customsetInput } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          customsets: {
            connectOrCreate: {
              where: {
                serviceId_name: {
                  serviceId: serviceId,
                  name: customsetInput.name,
                },
              },
              create: {
                name: customsetInput.name,
                description: customsetInput.description,
                createdBy: {
                  connect: {
                    id: ctx.session?.user?.id,
                  },
                },
                customsetInfo: {
                  create: {
                    ...customsetInput.customsetInfo,
                  },
                },
              },
            },
          },
        },
        include: {
          customsets: {
            include: {
              customsetInfo: true,
              createdBy: true,
            },
          },
        },
      });

      return service;
    }),
  updateCustomset: protectedProcedure
    .input(customsetWithServiceSchema)
    .mutation(async ({ input, ctx }) => {
      const { serviceId, ...customsetInput } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          customsets: {
            update: {
              where: {
                id: customsetInput.id || "",
              },
              data: {
                name: customsetInput.name,
                description: customsetInput.description,
                createdBy: {
                  connect: {
                    id: ctx.session?.user?.id,
                  },
                },
                customsetInfo: {
                  update: {
                    ...customsetInput.customsetInfo,
                  },
                },
              },
            },
          },
        },
        include: {
          customsets: {
            include: {
              customsetInfo: true,
              createdBy: true,
            },
          },
        },
      });

      return service;
    }),
  removeCustomset: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { serviceId, name } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          customsets: {
            delete: {
              serviceId_name: {
                serviceId,
                name,
              },
            },
          },
        },
        include: {
          customsets: {
            include: {
              customsetInfo: true,
              createdBy: true,
            },
          },
        },
      });

      return service;
    }),
  addProvider: protectedProcedure
    .input(providerSchema)
    .mutation(async ({ input }) => {
      const { serviceId, ...provider } = input;

      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          providers: {
            connectOrCreate: {
              where: {
                serviceId_type_name: {
                  serviceId: serviceId || "",
                  type: provider?.type,
                  name: provider?.name,
                },
              },
              create: {
                ...provider,
                details: provider?.details as Prisma.JsonObject,
              },
            },
          },
        },
        include: {
          providers: true,
        },
      });

      return service;
    }),
  updateProvider: protectedProcedure
    .input(providerSchema)
    .mutation(async ({ input }) => {
      const { serviceId, ...provider } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          providers: {
            update: {
              where: {
                id: provider.id,
              },
              data: {
                ...provider,
                details: (provider?.details || {}) as Prisma.JsonObject,
              },
            },
          },
        },
        include: {
          providers: true,
        },
      });

      return service;
    }),
  removeProvider: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { serviceId, id } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          providers: {
            delete: {
              id,
            },
          },
        },
        include: {
          providers: true,
        },
      });

      return service;
    }),
});
