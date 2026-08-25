import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DriverLocationPingInput } from "@moja/schemas";
import {
	FLUSH_SWEEP_INTERVAL_MS,
	OFFLINE_FLUSH_CHUNK_SIZE,
	OFFLINE_QUEUE_CAP,
	chunkQueue,
	nextWsBackoffMs,
	shouldFlagHarshBraking,
} from "./telemetry-core";

export const LOCATION_TASK_NAME = "MOJA_DRIVER_LOCATION_TRACKING";
const OFFLINE_PINGS_KEY = "driver_offline_pings_queue";
const TELEMETRY_STATE_KEY = "driver_telemetry_state";
// Phase 09 Option B — v1 transport is HTTP-only: no localhost default, no
// connection attempts unless a gateway URL is explicitly configured (i.e.
// when the live-tracking consumer ships and the dormant gateway is hosted).
const WS_BASE_URL = process.env["EXPO_PUBLIC_WS_URL"];
const HTTP_BASE_URL =
	process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000";

const ACTIVE_DRIVER_ID_KEY = "driver_active_profile_id";
// Exported so surfaces like the QR scanner can bind their requests to the
// active run (Phase 03 check-in authorization). Set at Start Run only.
export const ACTIVE_TRIP_ID_KEY = "driver_active_trip_id";
const TELEMETRY_AUTH_TOKEN_KEY = "driver_telemetry_auth_token";

// Threshold constants
export const HIGHWAY_SPEED_LIMIT_KMH = 110;
/**
 * Kept for schema/UI compatibility — the operative harsh-brake decision is
 * `shouldFlagHarshBraking()` in ./telemetry-core (deceleration severity).
 */
export const HARSH_BRAKE_THRESHOLD_KMH = 25;

let wsInstance: WebSocket | null = null;
let currentDriverProfileId: string | null = null;
let currentTripId: string | null = null;
// P1-4 — dispatch token minted by drivers.startTrip, persisted for
// background-task restarts and attached to every WS/HTTP ingest call.
let currentAuthToken: string | null = null;

// Phase 09 — per-segment reconnect budget state.
let wsReconnectAttempt = 0;
let lastSegmentTripId: string | null | undefined;
let wsDormancyLogged = false;

// Phase 10 (F-TM-06) — injected by the UI layer at Start Run so this plain
// lib can self-heal an expired dispatch token without importing React/tRPC.
type TelemetryReauthHandler = () => Promise<string | null>;
let reauthHandler: TelemetryReauthHandler | null = null;

export function setTelemetryReauthHandler(
	handler: TelemetryReauthHandler | null,
) {
	reauthHandler = handler;
}

export function setTelemetryAuthToken(token: string | null) {
	currentAuthToken = token;
	if (token) {
		activeTelemetryHealth.needsReauth = false;
		AsyncStorage.setItem(TELEMETRY_AUTH_TOKEN_KEY, token).catch(() => {});
	} else {
		AsyncStorage.removeItem(TELEMETRY_AUTH_TOKEN_KEY).catch(() => {});
	}
}

async function getTelemetryAuthToken(): Promise<string | null> {
	if (currentAuthToken) return currentAuthToken;
	try {
		currentAuthToken = await AsyncStorage.getItem(TELEMETRY_AUTH_TOKEN_KEY);
	} catch {}
	return currentAuthToken;
}

// Telemetry buffer state
let lastPingTimestamp = 0;
let lastSpeedKmh = 0;
let lastPingLocation: { latitude: number; longitude: number } | null = null;

export interface TelemetryHealthState {
	isConnected: boolean;
	queueLength: number;
	lastPingAt: Date | null;
	lastSpeedKmh: number;
	isOverspeed: boolean;
	isHarshBraking: boolean;
	adaptiveMode: "HIGH_RATE" | "STATIONARY" | "OFFLINE";
	/** Phase 10 (F-TM-06) — token expired AND re-mint failed; UI should surface re-auth. */
	needsReauth: boolean;
}

let activeTelemetryHealth: TelemetryHealthState = {
	isConnected: false,
	queueLength: 0,
	lastPingAt: null,
	lastSpeedKmh: 0,
	isOverspeed: false,
	isHarshBraking: false,
	adaptiveMode: "OFFLINE",
	needsReauth: false,
};

export function getActiveTelemetryHealth(): TelemetryHealthState {
	return { ...activeTelemetryHealth };
}

/**
 * Initializes and connects WebSocket telemetry stream for active driver.
 * Phase 09 Option B: without EXPO_PUBLIC_WS_URL the gateway is DORMANT — we
 * never dial, and this path exists to register ids + drain the offline queue.
 */
export async function connectTelemetrySocket(
	driverProfileId: string,
	tripId?: string
) {
	currentDriverProfileId = driverProfileId;
	if (tripId !== currentTripId) {
		wsReconnectAttempt = 0; // new trip segment → fresh reconnect budget
	}
	if (tripId) currentTripId = tripId;
	lastSegmentTripId = currentTripId;

	AsyncStorage.setItem(ACTIVE_DRIVER_ID_KEY, driverProfileId).catch(() => {});
	if (tripId) {
		AsyncStorage.setItem(ACTIVE_TRIP_ID_KEY, tripId).catch(() => {});
	}

	// Drain any dead-zone backlog regardless of transport posture.
	void flushOfflinePings();

	if (!WS_BASE_URL) {
		if (!wsDormancyLogged) {
			console.log(
				"[Telemetry] WS gateway dormant (Phase 09 Option B) — HTTP ingest only.",
			);
			wsDormancyLogged = true;
		}
		activeTelemetryHealth.isConnected = false;
		return;
	}

	if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
		activeTelemetryHealth.isConnected = true;
		return;
	}

	try {
		const authToken = await getTelemetryAuthToken();
		const authQuery = authToken ? `&token=${encodeURIComponent(authToken)}` : "";
		const url = `${WS_BASE_URL}?driverId=${driverProfileId}${currentTripId ? `&tripId=${currentTripId}` : ""}${authQuery}`;
		wsInstance = new WebSocket(url);

		wsInstance.onopen = () => {
			console.log("[Telemetry] Connected to WebSocket gateway");
			wsReconnectAttempt = 0;
			activeTelemetryHealth.isConnected = true;
			flushOfflinePings().catch(() => {});
		};

		wsInstance.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data);
				if (msg.event === "telemetry:ack") {
					// Gateway acknowledged receipt
				}
			} catch {}
		};

		wsInstance.onclose = () => {
			activeTelemetryHealth.isConnected = false;
			wsReconnectAttempt += 1;
			const delayMs = nextWsBackoffMs(wsReconnectAttempt);
			if (delayMs === null) {
				console.log(
					`[Telemetry] WS reconnect budget exhausted (${wsReconnectAttempt}) for this segment — HTTP ingest continues.`,
				);
				return;
			}
			console.log(
				`[Telemetry] WS disconnected — retry ${wsReconnectAttempt} in ${delayMs}ms`,
			);
			setTimeout(() => {
				if (currentDriverProfileId) {
					void connectTelemetrySocket(
						currentDriverProfileId,
						currentTripId || undefined
					);
				}
			}, delayMs);
		};

		wsInstance.onerror = (err) => {
			activeTelemetryHealth.isConnected = false;
			console.warn("[Telemetry] WebSocket error:", err);
		};
	} catch (err) {
		activeTelemetryHealth.isConnected = false;
		console.warn("[Telemetry] Failed to initiate WebSocket:", err);
	}
}

export function disconnectTelemetrySocket() {
	if (wsInstance) {
		wsInstance.close();
		wsInstance = null;
	}
	activeTelemetryHealth.isConnected = false;
	currentDriverProfileId = null;
	currentTripId = null;
}

/**
 * Evaluates telemetry metrics, performs anomaly checks, and streams the ping frame.
 */
export async function sendTelemetryPing(
	location: Location.LocationObject,
	tripId?: string
) {
	if (!currentDriverProfileId) {
		try {
			currentDriverProfileId = await AsyncStorage.getItem(ACTIVE_DRIVER_ID_KEY);
			if (!currentTripId) {
				currentTripId = await AsyncStorage.getItem(ACTIVE_TRIP_ID_KEY);
			}
		} catch {}
	}
	if (!currentDriverProfileId) return;

	const now = Date.now();
	const speedKmh = Math.max(0, (location.coords.speed || 0) * 3.6);
	const timeDeltaSec = (now - lastPingTimestamp) / 1000;

	// Anomaly Detection: Overspeed (>110 km/h); Harsh Braking per deceleration
	// severity (telemetry-core) — see Phase 10 D5 for the physics rationale.
	const isOverspeed = speedKmh > HIGHWAY_SPEED_LIMIT_KMH;
	const isHarshBraking =
		lastPingTimestamp > 0 &&
		shouldFlagHarshBraking(lastSpeedKmh, speedKmh, timeDeltaSec);

	// Adaptive frequency mode
	const adaptiveMode = speedKmh < 5 ? "STATIONARY" : "HIGH_RATE";

	activeTelemetryHealth = {
		...activeTelemetryHealth,
		lastPingAt: new Date(now),
		lastSpeedKmh: speedKmh,
		isOverspeed,
		isHarshBraking,
		adaptiveMode,
	};

	lastPingTimestamp = now;
	lastSpeedKmh = speedKmh;
	lastPingLocation = {
		latitude: location.coords.latitude,
		longitude: location.coords.longitude,
	};

	const ping: DriverLocationPingInput = {
		driverProfileId: currentDriverProfileId,
		tripId: tripId || currentTripId || undefined,
		latitude: location.coords.latitude,
		longitude: location.coords.longitude,
		speedKmh,
		heading: location.coords.heading || undefined,
		accuracyMeters: location.coords.accuracy || 5,
		altitudeMeters: location.coords.altitude || undefined,
		recordedAt: new Date(location.timestamp),
	};

	if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
		wsInstance.send(
			JSON.stringify({
				event: "telemetry:ping",
				data: {
					...ping,
					isOverspeed,
					isHarshBraking,
				},
			})
		);
	} else {
		await queueOfflinePing(ping);
		sendHttpPingFallback(ping).catch(() => {});
	}
}

async function queueOfflinePing(ping: DriverLocationPingInput) {
	try {
		const raw = await AsyncStorage.getItem(OFFLINE_PINGS_KEY);
		const queue: DriverLocationPingInput[] = raw ? JSON.parse(raw) : [];
		queue.push(ping);
		let dropped = 0;
		while (queue.length > OFFLINE_QUEUE_CAP) {
			queue.shift();
			dropped += 1;
		}
		if (dropped > 0) {
			console.warn(`[Telemetry] offline queue full — dropped ${dropped} oldest ping(s)`);
		}
		activeTelemetryHealth.queueLength = queue.length;
		await AsyncStorage.setItem(OFFLINE_PINGS_KEY, JSON.stringify(queue));
	} catch {}
}

async function postTelemetryHttp(body: unknown): Promise<Response> {
	const authToken = await getTelemetryAuthToken();
	return fetch(`${HTTP_BASE_URL}/api/v1/telemetry/ping`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
		},
		body: JSON.stringify(body),
	});
}

async function writeQueue(remaining: DriverLocationPingInput[]) {
	if (remaining.length === 0) {
		await AsyncStorage.removeItem(OFFLINE_PINGS_KEY);
	} else {
		await AsyncStorage.setItem(OFFLINE_PINGS_KEY, JSON.stringify(remaining));
	}
	activeTelemetryHealth.queueLength = remaining.length;
}

/**
 * Phase 10 (F-TM-04) — chunked drain. The server caps batches at 100, so the
 * old whole-queue POST permanently wedged any backlog larger than that. Now:
 * sequential ≤100 chunks, remainder preserved on failure, and each chunk's
 * removal happens only after its success. Rejected pings inside a 200 are
 * intentionally dropped with the chunk — they failed validation/authorization
 * server-side and no retry can fix them.
 *
 * Trigger points (Phase 09 Option B): tracking start, every successful live
 * ping, the periodic sweep, and legacy WS-open when a gateway is configured.
 */
async function flushOfflinePings() {
	try {
		const raw = await AsyncStorage.getItem(OFFLINE_PINGS_KEY);
		if (!raw) return;
		let remaining: DriverLocationPingInput[] = JSON.parse(raw);
		if (remaining.length === 0) return;

		for (const chunk of chunkQueue(remaining, OFFLINE_FLUSH_CHUNK_SIZE)) {
			const response = await postTelemetryHttp({ pings: chunk });

			if (response.status === 401) {
				// Phase 10 (F-TM-06) — try assignment-checked re-mint once before
				// giving up; never loop on an unauthorized endpoint.
				if (reauthHandler) {
					const fresh = await reauthHandler();
					if (fresh) {
						continue; // token rotated — retry this same chunk next pass
					}
				}
				setTelemetryAuthToken(null);
				activeTelemetryHealth.needsReauth = true;
				console.warn(
					`[Telemetry] flush unauthorized and re-mint unavailable — ${remaining.length} ping(s) preserved`,
				);
				return;
			}

			if (!response.ok) {
				console.warn(
					`[Telemetry] flush chunk failed (${response.status}) — ${remaining.length} ping(s) kept`,
				);
				return;
			}

			remaining = remaining.slice(chunk.length);
			await writeQueue(remaining);
			if (chunk.length > 0) {
				console.log(`[Telemetry] flushed ${chunk.length} offline ping(s)`);
			}
			if (remaining.length === 0) break;
		}
	} catch (err) {
		console.warn("[Telemetry] offline flush error:", err);
	}
}

async function sendHttpPingFallback(ping: DriverLocationPingInput) {
	try {
		const response = await postTelemetryHttp(ping);
		if (response.ok) {
			// Network proven alive — opportunistically drain any backlog now.
			void flushOfflinePings();
			return;
		}
		if (response.status === 401) {
			if (reauthHandler) {
				const fresh = await reauthHandler();
				if (!fresh) {
					setTelemetryAuthToken(null);
					activeTelemetryHealth.needsReauth = true;
				}
				return;
			}
			setTelemetryAuthToken(null);
			activeTelemetryHealth.needsReauth = true;
		}
	} catch {}
}

/**
 * Registers background TaskManager location handler.
 */
if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
	TaskManager.defineTask(
		LOCATION_TASK_NAME,
		async ({ data, error }: { data: any; error: any }) => {
			if (error) {
				console.error("[Telemetry] Background location task error:", error);
				return;
			}
			if (data) {
				const { locations } = data as { locations: Location.LocationObject[] };
				if (locations && locations.length > 0) {
					const latest = locations[locations.length - 1];
					if (latest) {
						await sendTelemetryPing(latest);
					}
				}
			}
		}
	);
}

let flushSweepTimer: ReturnType<typeof setInterval> | null = null;

function stopFlushSweep() {
	if (flushSweepTimer) {
		clearInterval(flushSweepTimer);
		flushSweepTimer = null;
	}
}

/**
 * Starts background location telemetry tracking with battery-optimized adaptive thresholds.
 */
export async function startBackgroundLocationTracking(
	driverProfileId: string,
	tripId?: string
) {
	const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
	if (fgStatus !== "granted") {
		throw new Error("Foreground location permission is required for driver tracking.");
	}

	const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
	if (bgStatus !== "granted") {
		throw new Error("Background location permission is required for in-trip GPS dispatch.");
	}

	await connectTelemetrySocket(driverProfileId, tripId);

	// Phase 10 (F-TM-04) — the old drain trigger was WS-open, which never
	// fires under the HTTP-only posture. Sweep periodically while active.
	stopFlushSweep();
	flushSweepTimer = setInterval(() => {
		void flushOfflinePings();
	}, FLUSH_SWEEP_INTERVAL_MS);

	const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
	if (!isRegistered) {
		await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
			accuracy: Location.Accuracy.High,
			timeInterval: 5000, // Adaptive 5s interval
			distanceInterval: 10, // 10 meters
			deferredUpdatesInterval: 5000,
			showsBackgroundLocationIndicator: true,
			foregroundService: {
				notificationTitle: "Moja Driver — Live Telemetry Active",
				notificationBody: "Streaming live GPS vehicle coordinates to passengers & fleet controllers.",
				notificationColor: "#e11d48",
			},
		});
	}
}

/**
 * Stops background location tracking when trip ends or driver goes off duty.
 */
export async function stopBackgroundLocationTracking() {
	const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
	if (isRegistered) {
		await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
	}
	stopFlushSweep();
	setTelemetryReauthHandler(null);
	disconnectTelemetrySocket();
}
