import { createReactQueryHooks } from "@trpc/react";
import type { AppRouter } from "@transformer/backend/src";

export const trpc = createReactQueryHooks<AppRouter>();
