import { server } from "./server.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.all("/mcp", async (c) => {
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  return transport.handleRequest(c);
});



export const GET = handle(app);
export const POST = handle(app);
