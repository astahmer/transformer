import react from "@vitejs/plugin-react";
import jotaiDebugLabel from "jotai/babel/plugin-debug-label";
import jotaiReactRefresh from "jotai/babel/plugin-react-refresh";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
    base: "/",
    root: "./",
    build: { outDir: "./dist", sourcemap: true },
    optimizeDeps: {
        include: ["@emotion/react"],
        exclude: ["fromentries"],
    },
    plugins: [
        // https://jotai.org/docs/guides/vite
        react({ babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] } }),
        VitePWA(),
    ],
    resolve: {
        alias: [
            {
                find: "@",
                replacement: "/src",
            },
        ],
    },
});
