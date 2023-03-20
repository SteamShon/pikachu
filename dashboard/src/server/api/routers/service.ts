import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { contentTypeSchema } from "../../../components/schema/contentType";
import { customsetWithServiceSchema } from "../../../components/schema/customset";
import { placementSchema } from "../../../components/schema/placement";

import { serviceSchema } from "../../../components/schema/service";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const serviceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(serviceSchema)
    .mutation(async ({ input }) => {
      const { serviceConfig, ...service } = input;
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
        include: {
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
                  segments: true,
                },
              },
            },
          },
        },
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
        include: {
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
                  segments: true,
                },
              },
            },
          },
        },
      });

      return service;
    }),
  updatePlacement: protectedProcedure
    .input(placementSchema)
    .mutation(async ({ input }) => {
      const { serviceId, id } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          placements: {
            update: {
              where: {
                id,
              },
              data: input,
            },
          },
        },
        include: {
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
                  segments: true,
                },
              },
            },
          },
        },
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
        include: {
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
                  segments: true,
                },
              },
            },
          },
        },
      });

      return service;
    }),

  addContentType: protectedProcedure
    .input(contentTypeSchema)
    .mutation(async ({ input }) => {
      const { contentTypeInfo, ...contentTypeInput } = input;
      const { serviceId, ...contentType } = contentTypeInput;
      const contentTypeInfoJson = {
        ...contentTypeInfo,
        details: contentTypeInfo?.details as Prisma.JsonObject,
      };

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
        include: {
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
                  segments: true,
                },
              },
            },
          },
        },
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
        include: {
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
                  segments: true,
                },
              },
            },
          },
        },
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
        include: {
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
                  segments: true,
                },
              },
            },
          },
        },
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
});
