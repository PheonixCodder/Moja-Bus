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
import { telemetryThrottle } from "../lib/telemetry-throttle";
import {
  isRoomAllowedForClaims,
  isTelemetryAuthEnforced,
  type TelemetryDispatchClaims,
  type TelemetryTokenClaims,
  verifyAnyTelemetryToken,
} from "../lib/telemetry-token";
import { queueTelemetryPing } from "./telemetry-flush";
import {
  advanceReference,
  fetchPreviousPoint,
  type PreviousPoint,
} from "./telemetry-prev-point";
import { redisPub, setupTripTelemetryRelay } from "./telemetry-redis";
import { validateTelemetryPing } from "./telemetry-validator";

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
  driverProfileId?: string;
  companyId?: string;
  role?: "driver" | "operator" | "passenger";
  /** Set when the connection was authenticated via dispatch token (P1-4). */
  dispatchClaims?: TelemetryDispatchClaims;
  authClaims?: TelemetryTokenClaims;
  subscribedRooms: Set<string>;
  lastPing?: PreviousPoint | null;
}

class TelemetryWebSocketGateway {
  private wss: WebSocketServer;
  private clients: Set<ExtendedWebSocket> = new Set();
  private lastBroadcastByRoom: Map<
    string,
    { recordedAt: string | Date; driverProfileId: string }
  > = new Map();

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });

    // Phase 6 (D5) — Relay cross-instance and HTTP-ingested trip pings to local connected WS clients
    setupTripTelemetryRelay((tripId, payload) => {
      this.broadcastToRoom(`trip:${tripId}`, payload);
    });

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      const extWs = ws as ExtendedWebSocket;
      extWs.isAlive = true;
      extWs.subscribedRooms = new Set();
      this.clients.add(extWs);

      const { query } = parse(req.url || "", true);
      const tripId = query["tripId"] as string | undefined;
      const companyId = query["companyId"] as string | undefined;
      const driverId = query["driverId"] as string | undefined;

      // Phase 16 & Phase 6 — under enforcement the upgrade already verified the
      // token; identity, role, and room binding come from signed claims,
      // never from client-supplied query params.
      if (isTelemetryAuthEnforced()) {
        const rawToken = query["token"];
        const tokenStr = Array.isArray(rawToken)
          ? rawToken[0]
          : (rawToken ?? null);
        const claims = verifyAnyTelemetryToken(tokenStr);
        if (!claims) {
          ws.close(4401, "Unauthorized");
          return;
        }

        extWs.authClaims = claims;

        if ("role" in claims && claims.role === "operator") {
          extWs.role = "operator";
          extWs.userId = claims.sub;
          extWs.companyId = claims.c;
          this.joinRoom(extWs, `company:${claims.c}`);
        } else if ("role" in claims && claims.role === "passenger") {
          extWs.role = "passenger";
          extWs.userId = claims.u;
          this.joinRoom(extWs, `trip:${claims.t}`);
        } else {
          // Driver
          extWs.role = "driver";
          extWs.dispatchClaims = claims as TelemetryDispatchClaims;
          extWs.driverProfileId = claims.d;
          if (claims.c) {
            extWs.companyId = claims.c;
            this.joinRoom(extWs, `company:${claims.c}`);
          }
          if (claims.t) {
            this.joinRoom(extWs, `trip:${claims.t}`);
          }
        }
      } else {
        if (driverId) {
          extWs.driverProfileId = driverId;
          extWs.role = "driver";
        }
        if (companyId) {
          extWs.companyId = companyId;
          this.joinRoom(extWs, `company:${companyId}`);
        }
        if (tripId) {
          this.joinRoom(extWs, `trip:${tripId}`);
        }
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
    // Phase 6 (D8 / Issue B) — IP rate limit on WS upgrade before HMAC or handshake
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        ?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const ipGate = telemetryThrottle.ipGate(ip);
    if (!ipGate.ok) {
      logTelemetryEvent(
        "telemetry_throttled",
        { tier: "ip_ws_upgrade", ip, retryAfterMs: ipGate.retryAfterMs },
        "warn",
      );
      socket.write(
        `HTTP/1.1 429 Too Many Requests\r\nRetry-After: ${Math.ceil(ipGate.retryAfterMs / 1000)}\r\n\r\n`,
      );
      socket.destroy();
      return;
    }

    const { query } = parse(req.url || "", true);

    // Phase 16 & Phase 6 — reject unauthenticated upgrades before the handshake.
    if (isTelemetryAuthEnforced()) {
      const rawToken = query["token"];
      const tokenStr = Array.isArray(rawToken)
        ? rawToken[0]
        : (rawToken ?? null);
      const claims = verifyAnyTelemetryToken(tokenStr);
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
            // Phase 11 & Phase 6 — enforced connections may only join authorized rooms.
            // Company rooms are granted server-side from claims, never by client request.
            const claims = ws.authClaims ?? ws.dispatchClaims;
            if (
              isTelemetryAuthEnforced() &&
              !isRoomAllowedForClaims(parsed.room, claims)
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
          if (ws.role === "operator" || ws.role === "passenger") {
            ws.send(
              JSON.stringify({
                event: "telemetry:rejected",
                reason: "UNAUTHORIZED_SENDER",
              }),
            );
            break;
          }
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

  public broadcastToRoom(room: string, message: string) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.data?.recordedAt && parsed.data?.driverProfileId) {
        const key = `${room}:${parsed.data.driverProfileId}`;
        const last = this.lastBroadcastByRoom.get(key);
        const rec = String(parsed.data.recordedAt);
        if (last && String(last.recordedAt) === rec) {
          return; // Dedup frame
        }
        this.lastBroadcastByRoom.set(key, {
          recordedAt: parsed.data.recordedAt,
          driverProfileId: parsed.data.driverProfileId,
        });
        if (this.lastBroadcastByRoom.size > 5000) {
          const firstKey = this.lastBroadcastByRoom.keys().next().value;
          if (firstKey) this.lastBroadcastByRoom.delete(firstKey);
        }
      }
    } catch {}

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
