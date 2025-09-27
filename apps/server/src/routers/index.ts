import type {
  InferRouterInputs,
  InferRouterOutputs,
  RouterClient,
} from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../lib/orpc";
import { trainRouter } from "./train";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
  train: trainRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

export type ApiInputs = InferRouterInputs<AppRouter>;
export type ApiOutputs = InferRouterOutputs<AppRouter>;
