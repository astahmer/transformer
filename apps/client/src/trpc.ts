// utils/trpc.ts
import { createReactQueryHooks } from "@trpc/react";
import type { AppRouter } from "@transformer/backend/src/router";

export const trpc = createReactQueryHooks<AppRouter>();
