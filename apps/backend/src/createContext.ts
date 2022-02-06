import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async ({ req, res }: trpcNext.CreateNextContextOptions) => {
    // for API-response caching see https://trpc.io/docs/caching
    return {
        req,
        res,
    };
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
