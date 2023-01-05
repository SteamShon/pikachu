import { createTRPCRouter } from "./trpc";
import { exampleRouter } from "./routers/example";
import { customsetRouter } from "./routers/customset";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  customset: customsetRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
