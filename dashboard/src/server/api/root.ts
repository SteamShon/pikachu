import { adGroupRouter } from "./routers/adGroup";
import { awsRouter } from "./routers/aws";
import { campaignRouter } from "./routers/campaign";
import { contentTypeRouter } from "./routers/contentType";
import { cubeRouter } from "./routers/cube";
import { cubeConfigRouter } from "./routers/cubeConfig";
import { customsetRouter } from "./routers/customset";
import { exampleRouter } from "./routers/example";
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
  example: exampleRouter,
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
  aws: awsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
