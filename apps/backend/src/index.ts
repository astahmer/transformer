import type { inferProcedureOutput, inferProcedureInput, inferSubscriptionOutput } from "@trpc/server";
import type { AppRouter } from "./router";

export * from "./types";
export type { AppRouter } from "./router";

/**
 * Enum containing all api mutation paths
 */
export type TMutation = keyof AppRouter["_def"]["mutations"];

export type InferMutationInput<TRouteKey extends TMutation> = inferProcedureInput<
    AppRouter["_def"]["mutations"][TRouteKey]
>;
