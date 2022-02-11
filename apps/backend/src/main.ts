import "dotenv/config";

import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import http from "http";
import { createContext } from "./createContext";
import { appRouter } from "./router";

const port = process.env.PORT || 5000;
console.log("starting backend on port", port);
const handler = createHTTPHandler({ router: appRouter, createContext });

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Request-Method", "*");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }
    handler(req, res);
});

server.listen(port);
console.log("listening on", port);
