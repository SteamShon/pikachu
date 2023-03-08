import { adGroupRouter } from "./routers/adGroup";
import { campaignRouter } from "./routers/campaign";
import { contentTypeRouter } from "./routers/contentType";
import { cubeRouter } from "./routers/cube";
import { cubeConfigRouter } from "./routers/cubeConfig";
import { customsetRouter } from "./routers/customset";
import { placementRouter } from "./routers/placement";
import { placementGroupRouter } from "./routers/placementGroup";
import { serviceRouter } from "./routers/service";
import { userRouter } from "./routers/user";
import { usersOnServicesRouter } from "./routers/usersOnServices";
import { createTRPCRouter } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  customset: customsetRouter,
  user: userRouter,
  campaign: campaignRouter,
  adGroup: adGroupRouter,
  service: serviceRouter,
  placementGroup: placementGroupRouter,
  placement: placementRouter,
  contentType: contentTypeRouter,
  usersOnServices: usersOnServicesRouter,
  cubeConfig: cubeConfigRouter,
  cube: cubeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
