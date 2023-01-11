import { createTRPCRouter } from "./trpc";
import { customsetRouter } from "./routers/customset";
import { exampleRouter } from "./routers/example";
import { userRouter } from "./routers/user";
import { campaignRouter } from "./routers/campaign";

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
});

// export type definition of API
export type AppRouter = typeof appRouter;
