/**
 * Phase 29 (F-TM-13) — structured telemetry ingest observability.
 *
 * Every reject, flag, and stamped anomaly emits ONE single-line JSON record
 * so disputes are answerable from logs ("why did this driver lose points /
 * why is this stretch missing?"). Deliberately dependency-free: the
 * @vercel/otel instrumentation exists but no collector is configured in the
 * compose deployment, so console JSON is the durable forensic trail today
 * (any log drain captures it verbatim).
 *
 * Privacy floor: driverProfileId/tripId are internal identifiers; raw
 * coordinates are NEVER logged.
 */

export type TelemetryLogLevel = "info" | "warn" | "error";

export function logTelemetryEvent(
  event: string,
  fields: Record<string, unknown>,
  level: TelemetryLogLevel = "info",
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    svc: "telemetry",
    lvl: level,
    evt: event,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
