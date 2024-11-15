import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello, World!"));

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

export { injectWebSocket, app };
