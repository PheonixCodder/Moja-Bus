import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import { parse } from "node:url";
import { driverLocationPingSchema, type DriverLocationPingInput } from "@moja/schemas";
import { validateTelemetryPing } from "./telemetry-validator";
import { queueTelemetryPing } from "./telemetry-flush";
import { redisPub, redisSub } from "./telemetry-redis";

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
  driverProfileId?: string;
  companyId?: string;
  subscribedRooms: Set<string>;
  lastPing?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

class TelemetryWebSocketGateway {
  private wss: WebSocketServer;
  private clients: Set<ExtendedWebSocket> = new Set();

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      const extWs = ws as ExtendedWebSocket;
      extWs.isAlive = true;
      extWs.subscribedRooms = new Set();
      this.clients.add(extWs);

      const { query } = parse(req.url || "", true);
      const tripId = query["tripId"] as string | undefined;
      const companyId = query["companyId"] as string | undefined;
      const driverId = query["driverId"] as string | undefined;

      if (driverId) extWs.driverProfileId = driverId;
      if (companyId) extWs.companyId = companyId;

      // Auto-subscribe if requested in query params
      if (tripId) {
        this.joinRoom(extWs, `trip:${tripId}`);
      }
      if (companyId) {
        this.joinRoom(extWs, `company:${companyId}`);
      }

      extWs.on("pong", () => {
        extWs.isAlive = true;
      });

      extWs.on("message", (raw: Buffer) => {
        this.handleIncomingMessage(extWs, raw);
      });

      extWs.on("close", () => {
        this.clients.delete(extWs);
      });
    });

    // Heartbeat check every 30 seconds
    setInterval(() => {
      this.clients.forEach((ws) => {
        if (!ws.isAlive) {
          ws.terminate();
          this.clients.delete(ws);
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  public handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer) {
    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss.emit("connection", ws, req);
    });
  }

  private handleIncomingMessage(ws: ExtendedWebSocket, raw: Buffer) {
    try {
      const parsed = JSON.parse(raw.toString());
      const event = parsed.event;

      switch (event) {
        case "ping":
          ws.send(JSON.stringify({ event: "pong", timestamp: Date.now() }));
          break;

        case "subscribe":
          if (parsed.room) {
            this.joinRoom(ws, parsed.room);
            ws.send(JSON.stringify({ event: "subscribed", room: parsed.room }));
          }
          break;

        case "unsubscribe":
          if (parsed.room) {
            this.leaveRoom(ws, parsed.room);
            ws.send(JSON.stringify({ event: "unsubscribed", room: parsed.room }));
          }
          break;

        case "telemetry:ping":
          this.processTelemetryFrame(ws, parsed.data);
          break;

        default:
          break;
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ event: "error", message: err.message || "Invalid JSON payload" }));
    }
  }

  private processTelemetryFrame(ws: ExtendedWebSocket, data: unknown) {
    const parseResult = driverLocationPingSchema.safeParse(data);
    if (!parseResult.success) {
      ws.send(JSON.stringify({ event: "telemetry:rejected", errors: parseResult.error.issues }));
      return;
    }

    const ping = parseResult.data;

    // Run Safarpay-inspired anomaly detection gates
    const validation = validateTelemetryPing(ping, ws.lastPing);
    if (!validation.isValid) {
      ws.send(JSON.stringify({ event: "telemetry:anomalous", reason: validation.reason }));
      return;
    }

    // Update local client memory
    ws.lastPing = {
      latitude: ping.latitude,
      longitude: ping.longitude,
      timestamp: new Date(ping.recordedAt),
    };

    // Queue for batched database persistence
    queueTelemetryPing(ping);

    // Broadcast to trip room and company fleet room
    const broadcastPayload = JSON.stringify({
      event: "telemetry:update",
      data: {
        driverProfileId: ping.driverProfileId,
        tripId: ping.tripId,
        latitude: ping.latitude,
        longitude: ping.longitude,
        speedKmh: ping.speedKmh,
        heading: ping.heading,
        accuracyMeters: ping.accuracyMeters,
        recordedAt: ping.recordedAt,
      },
    });

    if (ping.tripId) {
      this.broadcastToRoom(`trip:${ping.tripId}`, broadcastPayload);
      redisPub.publish(`trip:${ping.tripId}:telemetry`, broadcastPayload).catch(() => {});
    }

    if (ws.companyId) {
      this.broadcastToRoom(`company:${ws.companyId}`, broadcastPayload);
      redisPub.publish(`operator:${ws.companyId}:fleet`, broadcastPayload).catch(() => {});
    }

    ws.send(JSON.stringify({ event: "telemetry:ack", recordedAt: ping.recordedAt }));
  }

  private joinRoom(ws: ExtendedWebSocket, room: string) {
    ws.subscribedRooms.add(room);
  }

  private leaveRoom(ws: ExtendedWebSocket, room: string) {
    ws.subscribedRooms.delete(room);
  }

  private broadcastToRoom(room: string, message: string) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.subscribedRooms.has(room)) {
        client.send(message);
      }
    });
  }
}

export const telemetryGateway = new TelemetryWebSocketGateway();
