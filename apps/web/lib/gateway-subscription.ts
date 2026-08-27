"use client";

import { useEffect, useRef, useState } from "react";

export interface GatewaySubscriptionOptions<T = any> {
  token: string | null | undefined;
  room?: string | null;
  enabled?: boolean;
  onMessage?: (data: T) => void;
  onConnectionChange?: (connected: boolean) => void;
}

const KEEPALIVE_INTERVAL_MS = 25_000;
const RECONNECT_BASE_MS = 5_000;
const RECONNECT_CAP_MS = 60_000;
const MAX_RECONNECT_ATTEMPTS = 5;

function nextBackoffMs(attempt: number): number | null {
  if (attempt > MAX_RECONNECT_ATTEMPTS) return null;
  return Math.min(
    RECONNECT_CAP_MS,
    RECONNECT_BASE_MS * Math.pow(2, attempt - 1),
  );
}

export function useGatewaySubscription<T = any>({
  token,
  room,
  enabled = true,
  onMessage,
  onConnectionChange,
}: GatewaySubscriptionOptions<T>) {
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onConnectionChangeRef = useRef(onConnectionChange);
  onConnectionChangeRef.current = onConnectionChange;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTabActiveRef = useRef(true);

  function cleanup() {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    onConnectionChangeRef.current?.(false);
  }

  function connect() {
    if (!enabled || !token || typeof window === "undefined") {
      cleanup();
      return;
    }

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${proto}//${host}/api/ws/telemetry?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        onConnectionChangeRef.current?.(true);
        reconnectAttemptRef.current = 0;

        // Subscribe to specified room if required
        if (room && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: "subscribe", room }));
        }

        // Setup ping interval
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: "ping" }));
          }
        }, KEEPALIVE_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === "telemetry:update" && msg.data) {
            onMessageRef.current?.(msg.data);
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        onConnectionChangeRef.current?.(false);
        wsRef.current = null;

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Reconnect with exponential backoff if enabled and tab is visible
        if (enabled && isTabActiveRef.current) {
          reconnectAttemptRef.current += 1;
          const delay = nextBackoffMs(reconnectAttemptRef.current);
          if (delay !== null) {
            reconnectTimerRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        onConnectionChangeRef.current?.(false);
      };
    } catch {
      setIsConnected(false);
      onConnectionChangeRef.current?.(false);
    }
  }

  useEffect(() => {
    function handleVisibility() {
      const isVisible = document.visibilityState === "visible";
      isTabActiveRef.current = isVisible;
      if (isVisible) {
        // Re-dial when returning to visible tab if disconnected
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reconnectAttemptRef.current = 0;
          connect();
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [token, room, enabled]);

  useEffect(() => {
    reconnectAttemptRef.current = 0;
    connect();
    return () => cleanup();
  }, [token, room, enabled]);

  return { isConnected };
}
