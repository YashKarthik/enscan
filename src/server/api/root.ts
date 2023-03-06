import { createTRPCRouter } from "~/server/api/trpc";
import { ethRegistrarControllerRouter } from "./routers/indexNameRegisteredEvents";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  ethRegistrarController: ethRegistrarControllerRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
