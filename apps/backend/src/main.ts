import { createHTTPServer, createHTTPHandler } from "@trpc/server/adapters/standalone";
import { createContext } from "./createContext";
import { appRouter } from "./router";
import http from "http";

console.log("starting backend");
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

server.listen(5000);
console.log("listening on 5000");
