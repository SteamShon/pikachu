import { createTRPCRouter } from "./trpc";
import { customsetRouter } from "./routers/customset";
import { exampleRouter } from "./routers/example";
import { userRouter } from "./routers/user";
import { campaignRouter } from "./routers/campaign";
import { adGroupRouter } from "./routers/adGroup";
import { serviceRouter } from "./routers/service";
import { placementGroupRouter } from "./routers/placementGroup";
import { contentTypeRouter } from "./routers/contentType";
import { usersOnServicesRouter } from "./routers/usersOnServices";
import { placementRouter } from "./routers/placement";

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
});

// export type definition of API
export type AppRouter = typeof appRouter;
