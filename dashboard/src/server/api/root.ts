import { adGroupRouter } from "./routers/adGroup";
import { campaignRouter } from "./routers/campaign";
import { contentTypeRouter } from "./routers/contentType";
import { customsetRouter } from "./routers/customset";
import { placementRouter } from "./routers/placement";
import { serviceRouter } from "./routers/service";
import { userRouter } from "./routers/user";
import { usersOnServicesRouter } from "./routers/usersOnServices";
import { createTRPCRouter } from "./trpc";
import { integrationRouter } from "./routers/integration";
import { contentRouter } from "./routers/content";
import { providerRouter } from "./routers/provider";
import { segmentRouter } from "./routers/segment";
import { adSetRouter } from "./routers/adSet";
import { jobRouter } from "./routers/job";

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
  placement: placementRouter,
  contentType: contentTypeRouter,
  usersOnServices: usersOnServicesRouter,
  content: contentRouter,
  provider: providerRouter,
  integration: integrationRouter,
  segment: segmentRouter,
  adSet: adSetRouter,
  job: jobRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
