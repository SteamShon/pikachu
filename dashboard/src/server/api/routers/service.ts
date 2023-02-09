import { z } from "zod";
import { contentTypeSchema } from "../../../components/schema/contentType";
import { customsetWithServiceSchema } from "../../../components/schema/customset";
import { placementGroupWithServiceSchema } from "../../../components/schema/placementGroup";

import { serviceSchema } from "../../../components/schema/service";
import { prisma } from "../../db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const serviceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(serviceSchema)
    .mutation(async ({ input }) => {
      const service = await prisma.service.create({
        data: {
          name: input.name,
          description: input.description,
          status: input.status,
        },
        /*
        include: {
          placementGroups: {
            include: {
              placements: true,
            },
          },
          contentTypes: {
            include: {
              contents: true,
            },
          },
        },
        */
      });

      return service;
    }),
  update: protectedProcedure
    .input(serviceSchema)
    .mutation(async ({ input }) => {
      const service = await prisma.service.update({
        where: {
          id: input?.id || "",
        },
        data: input,
      });
      return service;
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
    return await prisma.service.findMany();
  }),
  getAll: protectedProcedure.query(async ({}) => {
    const services = await prisma.service.findMany({
      include: {
        placementGroups: {
          include: {
            placements: true,
          },
        },
        contentTypes: {
          include: {
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
          placementGroups: {
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
            },
          },
          contentTypes: {
            include: {
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
          cubeConfigs: {
            include: {
              cubes: true,
            },
          },
        },
      });
    }),

  addPlacementGroup: protectedProcedure
    .input(placementGroupWithServiceSchema)
    .mutation(async ({ input }) => {
      const { serviceId, ...placementGroupInput } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          placementGroups: {
            connectOrCreate: {
              where: {
                serviceId_name: {
                  serviceId: serviceId,
                  name: placementGroupInput.name,
                },
              },
              create: placementGroupInput,
            },
          },
        },
        include: {
          placementGroups: {
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
            },
          },
          contentTypes: {
            include: {
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
          cubeConfigs: {
            include: {
              cubes: true,
            },
          },
        },
      });

      return service;
    }),
  updatePlacementGroup: protectedProcedure
    .input(placementGroupWithServiceSchema)
    .mutation(async ({ input }) => {
      const { serviceId, ...placementGroupInput } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          placementGroups: {
            update: {
              where: {
                id: placementGroupInput.id || "",
              },
              data: placementGroupInput,
            },
          },
        },
        include: {
          placementGroups: {
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
            },
          },
          contentTypes: {
            include: {
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
          cubeConfigs: {
            include: {
              cubes: true,
            },
          },
        },
      });

      return service;
    }),
  removePlacementGroup: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const service = await prisma.service.update({
        where: {
          id: input.serviceId,
        },
        data: {
          placementGroups: {
            delete: {
              serviceId_name: {
                serviceId: input.serviceId,
                name: input.name,
              },
            },
          },
        },
        include: {
          placementGroups: {
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
            },
          },
          contentTypes: {
            include: {
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
          cubeConfigs: {
            include: {
              cubes: true,
            },
          },
        },
      });

      return service;
    }),

  addContentType: protectedProcedure
    .input(contentTypeSchema.extend({ serviceId: z.string() }))
    .mutation(async ({ input }) => {
      const { serviceId, ...contentTypeInput } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          contentTypes: {
            connectOrCreate: {
              where: {
                serviceId_name: {
                  serviceId,
                  name: contentTypeInput.name,
                },
              },
              create: {
                ...contentTypeInput,
                defaultValues: JSON.stringify(contentTypeInput.defaultValues),
              },
            },
          },
        },
        include: {
          placementGroups: {
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
            },
          },
          contentTypes: {
            include: {
              contents: {
                include: {
                  creatives: true,
                },
              },
            },
          },
        },
      });

      return service;
    }),
  updateContentType: protectedProcedure
    .input(contentTypeSchema.extend({ serviceId: z.string() }))
    .mutation(async ({ input }) => {
      const { serviceId, ...contentTypeInput } = input;
      const service = await prisma.service.update({
        where: {
          id: serviceId,
        },
        data: {
          contentTypes: {
            update: {
              where: {
                id: contentTypeInput.id || "",
              },
              data: {
                ...contentTypeInput,
                defaultValues: JSON.stringify(contentTypeInput.defaultValues),
              },
            },
          },
        },
        include: {
          placementGroups: {
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
            },
          },
          contentTypes: {
            include: {
              contents: {
                include: {
                  creatives: true,
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
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const service = await prisma.service.update({
        where: {
          id: input.serviceId,
        },
        data: {
          contentTypes: {
            delete: {
              serviceId_name: {
                serviceId: input.serviceId,
                name: input.name,
              },
            },
          },
        },
        include: {
          contentTypes: {
            include: {
              contents: {
                include: {
                  creatives: true,
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
