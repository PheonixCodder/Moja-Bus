import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import type { Socket } from "node:net";
import { parse } from "node:url";
import next from "next";
// Phase 6 (2026-08-27) — Live-tracking consumer revival: custom server
// active in production hosting the Real-Time Telemetry Gateway alongside Next.js.
import { telemetryGateway } from "./server/telemetry-ws";

const dev = process.env["NODE_ENV"] !== "production";
const port = parseInt(process.env["PORT"] || "3000", 10);
const hostname = process.env["HOSTNAME"] || "0.0.0.0";
const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const server: Server = createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const parsedUrl = parse(req.url || "", true);
      handle(req, res, parsedUrl);
    },
  );

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

  server.listen(port, hostname, () => {
    console.log(
      `> Moja Bus Ready on http://${hostname}:${port} with Real-Time Telemetry Gateway`,
    );
  });
});
