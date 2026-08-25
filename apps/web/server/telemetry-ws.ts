/**
 * Phase 09 Option B — DORMANT in production. v1 transport is HTTP-only
 * (`/api/v1/telemetry/ping`, authenticated + serverless-safe); no deploy
 * artifact starts the custom server that hosts this gateway, and the driver
 * app dials no WS unless EXPO_PUBLIC_WS_URL is explicitly configured.
 *
 * Phase 11 (2026-08-23): claims-derived room ACL + `operator:{c}:fleet`
 * publish are LANDED here (unit-tested at the pure layer); end-to-end socket
 * verification happens at revival staging.
 *
 * Remaining revival checklist (when the live-tracking consumer ships):
 * host via a `runner-ws` image stage or Next custom-server image, add a
 * Caddy upgrade passthrough, design + implement OPERATOR subscriber
 * credentials (drivers are already claim-bounded), then flip the client env.
 */

import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import { parse } from "node:url";
import {
  type DriverLocationPingInput,
  driverLocationPingSchema,
} from "@moja/schemas";
import { WebSocket, WebSocketServer } from "ws";
import { logTelemetryEvent } from "../lib/telemetry-observability";
import {
  isRoomAllowedForClaims,
  isTelemetryAuthEnforced,
  type TelemetryDispatchClaims,
  verifyTelemetryDispatchToken,
} from "../lib/telemetry-token";
import { queueTelemetryPing } from "./telemetry-flush";
import {
  advanceReference,
  fetchPreviousPoint,
  type PreviousPoint,
} from "./telemetry-prev-point";
import { redisPub } from "./telemetry-redis";
import { validateTelemetryPing } from "./telemetry-validator";

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
  driverProfileId?: string;
  companyId?: string;
  /** Set when the connection was authenticated via dispatch token (P1-4). */
  dispatchClaims?: TelemetryDispatchClaims;
  subscribedRooms: Set<string>;
  lastPing?: PreviousPoint | null;
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

      // Phase 16 (P1-4) — under enforcement the upgrade already verified the
      // dispatch token; identity and room binding come from signed claims,
      // never from client-supplied query params.
      if (isTelemetryAuthEnforced()) {
        const rawToken = query["token"];
        const claims = verifyTelemetryDispatchToken(
          Array.isArray(rawToken) ? rawToken[0] : (rawToken ?? null),
        );
        if (!claims) {
          ws.close(4401, "Unauthorized");
          return;
        }
        extWs.dispatchClaims = claims;
        extWs.driverProfileId = claims.d;
        // Phase 11 (F-TM-02) — fleet-channel attribution now comes from the
        // signed claim, not client query params, so `operator:{c}:fleet`
        // actually publishes under enforcement.
        if (claims.c) {
          extWs.companyId = claims.c;
        }
      } else {
        if (driverId) extWs.driverProfileId = driverId;
        if (companyId) extWs.companyId = companyId;
      }

      // Auto-subscribe if requested in query params
      const boundTripId = extWs.dispatchClaims?.t ?? tripId;
      if (boundTripId) {
        this.joinRoom(extWs, `trip:${boundTripId}`);
      }
      if (extWs.companyId) {
        this.joinRoom(extWs, `company:${extWs.companyId}`);
      }

      // Phase 28 (F-TM-07) — seed the jump-gate cache from the SHARED store
      // so a reconnecting socket resumes where the last persisted fix left
      // off (transport parity with the HTTP path). Never clobbers a ping
      // that already arrived before the seed resolved.
      if (extWs.driverProfileId) {
        const seededId = extWs.driverProfileId;
        void fetchPreviousPoint(seededId)
          .then((point) => {
            if (
              !extWs.lastPing &&
              point &&
              extWs.driverProfileId === seededId
            ) {
              extWs.lastPing = point;
            }
          })
          .catch(() => {
            /* blind start — identical to pre-Phase-28 behavior */
          });
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
    const { query } = parse(req.url || "", true);

    // Phase 16 (P1-4) — reject unauthenticated upgrades before the handshake.
    if (isTelemetryAuthEnforced()) {
      const rawToken = query["token"];
      const claims = verifyTelemetryDispatchToken(
        Array.isArray(rawToken) ? rawToken[0] : (rawToken ?? null),
      );
      if (!claims) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this.wss.emit("connection", ws, req);
      });
      return;
    }

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
            // Phase 11 (F-TM-03 ≡ F-IN-03) — enforced connections may only
            // join the room their own token derives (`trip:${claims.t}`);
            // everything else is explicitly rejected, never joined silently.
            // Company rooms are granted server-side from claims, never by
            // client request.
            if (
              ws.dispatchClaims &&
              !isRoomAllowedForClaims(parsed.room, ws.dispatchClaims)
            ) {
              ws.send(
                JSON.stringify({
                  event: "error",
                  message: "Room not authorized for this token",
                }),
              );
              break;
            }
            this.joinRoom(ws, parsed.room);
            ws.send(JSON.stringify({ event: "subscribed", room: parsed.room }));
          }
          break;

        case "unsubscribe":
          if (parsed.room) {
            this.leaveRoom(ws, parsed.room);
            ws.send(
              JSON.stringify({ event: "unsubscribed", room: parsed.room }),
            );
          }
          break;

        case "telemetry:ping":
          this.processTelemetryFrame(ws, parsed.data);
          break;

        default:
          break;
      }
    } catch (err: any) {
      ws.send(
        JSON.stringify({
          event: "error",
          message: err.message || "Invalid JSON payload",
        }),
      );
    }
  }

  private processTelemetryFrame(ws: ExtendedWebSocket, data: unknown) {
    const parseResult = driverLocationPingSchema.safeParse(data);
    if (!parseResult.success) {
      ws.send(
        JSON.stringify({
          event: "telemetry:rejected",
          errors: parseResult.error.issues,
        }),
      );
      return;
    }

    const parsed = parseResult.data as DriverLocationPingInput;

    // Phase 16 (P1-4) — authenticated connections stream under their own
    // identity only: spoofed payload ids are rejected, not rewritten.
    if (ws.dispatchClaims) {
      if (parsed.driverProfileId !== ws.dispatchClaims.d) {
        ws.send(
          JSON.stringify({
            event: "telemetry:rejected",
            reason: "IDENTITY_MISMATCH",
          }),
        );
        return;
      }
      if (
        ws.dispatchClaims.t &&
        parsed.tripId &&
        parsed.tripId !== ws.dispatchClaims.t
      ) {
        ws.send(
          JSON.stringify({
            event: "telemetry:rejected",
            reason: "TRIP_MISMATCH",
          }),
        );
        return;
      }
      if (ws.dispatchClaims.t && !parsed.tripId) {
        parsed.tripId = ws.dispatchClaims.t;
      }
    }

    // Run Safarpay-inspired anomaly detection gates. Phase 28/29: poor
    // accuracy no longer rejects here — it is stamped LOW_ACCURACY by the
    // flush authority; only physically-impossible signals reject.
    const validation = validateTelemetryPing(parsed, ws.lastPing);
    if (!validation.isValid) {
      logTelemetryEvent(
        "telemetry_ping_rejected",
        {
          transport: "ws",
          driverProfileId: ws.driverProfileId ?? null,
          tripId: parsed.tripId ?? null,
          accuracyMeters: parsed.accuracyMeters ?? null,
          reason: validation.reason,
          calculatedSpeedKmh: validation.calculatedSpeedKmh ?? null,
        },
        "warn",
      );
      ws.send(
        JSON.stringify({
          event: "telemetry:anomalous",
          reason: validation.reason,
        }),
      );
      return;
    }

    // Update local client memory — but ONLY a good fix may become the next
    // reference (anti-evasion rule shared with the HTTP path): a bad first
    // ping leaves the cache null rather than seeding an untrusted anchor.
    ws.lastPing = advanceReference(ws.lastPing ?? null, parsed);

    // Queue for batched database persistence
    queueTelemetryPing(parsed);

    // Broadcast to trip room and company fleet room
    const broadcastPayload = JSON.stringify({
      event: "telemetry:update",
      data: {
        driverProfileId: parsed.driverProfileId,
        tripId: parsed.tripId,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        speedKmh: parsed.speedKmh,
        heading: parsed.heading,
        accuracyMeters: parsed.accuracyMeters,
        recordedAt: parsed.recordedAt,
      },
    });

    if (parsed.tripId) {
      this.broadcastToRoom(`trip:${parsed.tripId}`, broadcastPayload);
      redisPub
        .publish(`trip:${parsed.tripId}:telemetry`, broadcastPayload)
        .catch(() => {});
    }

    if (ws.companyId) {
      this.broadcastToRoom(`company:${ws.companyId}`, broadcastPayload);
      redisPub
        .publish(`operator:${ws.companyId}:fleet`, broadcastPayload)
        .catch(() => {});
    }

    ws.send(
      JSON.stringify({ event: "telemetry:ack", recordedAt: parsed.recordedAt }),
    );
  }

  private joinRoom(ws: ExtendedWebSocket, room: string) {
    ws.subscribedRooms.add(room);
  }

  private leaveRoom(ws: ExtendedWebSocket, room: string) {
    ws.subscribedRooms.delete(room);
  }

  private broadcastToRoom(room: string, message: string) {
    this.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.subscribedRooms.has(room)
      ) {
        client.send(message);
      }
    });
  }
}

export const telemetryGateway = new TelemetryWebSocketGateway();
