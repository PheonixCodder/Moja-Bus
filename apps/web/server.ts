import { parse } from "node:url";
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import next from "next";
import type { Socket } from "node:net";
import { telemetryGateway } from "./server/telemetry-ws";

const dev = process.env["NODE_ENV"] !== "production";
const port = parseInt(process.env["PORT"] || "3000", 10);
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  server.on("upgrade", (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const { pathname } = parse(req.url || "/", true);

    if (pathname === "/_next/webpack-hmr") {
      nextApp.getUpgradeHandler()(req, socket, head);
    } else if (pathname === "/api/ws/telemetry" || pathname === "/api/ws") {
      telemetryGateway.handleUpgrade(req, socket, head);
    } else {
      socket.destroy();
    }
  });

  server.listen(port, () => {
    console.log(`> Moja Bus Ready on http://localhost:${port} with Real-Time Telemetry Gateway`);
  });
});
