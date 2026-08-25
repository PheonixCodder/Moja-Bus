import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import type { Socket } from "node:net";
import { parse } from "node:url";
import next from "next";
// Phase 09 Option B — v1 transport is HTTP-only. This custom server (and the
// gateway in ./server/telemetry-ws) is DORMANT: production runs the Next
// standalone server, and no deploy artifact starts this file. It is kept for
// dev experimentation (`pnpm --filter web dev:ws`) and for revival when the
// live-tracking consumer ships — revival requires Phase 11 (room authz +
// fleet channel) and a hosted image with a Caddy upgrade passthrough.
import { telemetryGateway } from "./server/telemetry-ws";

const dev = process.env["NODE_ENV"] !== "production";
const port = parseInt(process.env["PORT"] || "3000", 10);
const nextApp = next({ dev });
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

  server.listen(port, () => {
    console.log(
      `> Moja Bus Ready on http://localhost:${port} with Real-Time Telemetry Gateway`,
    );
  });
});
