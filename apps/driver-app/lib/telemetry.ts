import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DriverLocationPingInput } from "@moja/schemas";

export const LOCATION_TASK_NAME = "MOJA_DRIVER_LOCATION_TRACKING";
const OFFLINE_PINGS_KEY = "driver_offline_pings_queue";
const WS_BASE_URL =
	process.env["EXPO_PUBLIC_WS_URL"] ?? "ws://localhost:3000/api/ws/telemetry";
const HTTP_BASE_URL =
	process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000";

let wsInstance: WebSocket | null = null;
let currentDriverProfileId: string | null = null;
let currentTripId: string | null = null;

/**
 * Initializes and connects WebSocket telemetry stream for active driver.
 */
export function connectTelemetrySocket(driverProfileId: string, tripId?: string) {
	currentDriverProfileId = driverProfileId;
	if (tripId) currentTripId = tripId;

	if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
		return;
	}

	try {
		const url = `${WS_BASE_URL}?driverId=${driverProfileId}${tripId ? `&tripId=${tripId}` : ""}`;
		wsInstance = new WebSocket(url);

		wsInstance.onopen = () => {
			console.log("[Telemetry] Connected to WebSocket gateway");
			flushOfflinePings().catch(() => {});
		};

		wsInstance.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data);
				if (msg.event === "telemetry:ack") {
					// Ping acknowledged
				}
			} catch {}
		};

		wsInstance.onclose = () => {
			console.log("[Telemetry] WebSocket disconnected, will reconnect in 5s");
			setTimeout(() => {
				if (currentDriverProfileId) {
					connectTelemetrySocket(currentDriverProfileId, currentTripId || undefined);
				}
			}, 5000);
		};

		wsInstance.onerror = (err) => {
			console.warn("[Telemetry] WebSocket error:", err);
		};
	} catch (err) {
		console.warn("[Telemetry] Failed to initiate WebSocket:", err);
	}
}

export function disconnectTelemetrySocket() {
	if (wsInstance) {
		wsInstance.close();
		wsInstance = null;
	}
	currentDriverProfileId = null;
	currentTripId = null;
}

/**
 * Sends a live GPS telemetry frame over WebSocket or falls back to offline queue.
 */
export async function sendTelemetryPing(
	location: Location.LocationObject,
	tripId?: string
) {
	if (!currentDriverProfileId) return;

	const ping: DriverLocationPingInput = {
		driverProfileId: currentDriverProfileId,
		tripId: tripId || currentTripId || undefined,
		latitude: location.coords.latitude,
		longitude: location.coords.longitude,
		speedKmh: Math.max(0, (location.coords.speed || 0) * 3.6),
		heading: location.coords.heading || undefined,
		accuracyMeters: location.coords.accuracy || 5,
		altitudeMeters: location.coords.altitude || undefined,
		recordedAt: new Date(location.timestamp),
	};

	if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
		wsInstance.send(JSON.stringify({ event: "telemetry:ping", data: ping }));
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
		if (queue.length > 500) queue.shift();
		await AsyncStorage.setItem(OFFLINE_PINGS_KEY, JSON.stringify(queue));
	} catch {}
}

async function flushOfflinePings() {
	try {
		const raw = await AsyncStorage.getItem(OFFLINE_PINGS_KEY);
		if (!raw) return;
		const queue: DriverLocationPingInput[] = JSON.parse(raw);
		if (queue.length === 0) return;

		const response = await fetch(`${HTTP_BASE_URL}/api/v1/telemetry/ping`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ pings: queue }),
		});

		if (response.ok) {
			await AsyncStorage.removeItem(OFFLINE_PINGS_KEY);
			console.log(`[Telemetry] Flushed ${queue.length} offline pings successfully`);
		}
	} catch {}
}

async function sendHttpPingFallback(ping: DriverLocationPingInput) {
	try {
		await fetch(`${HTTP_BASE_URL}/api/v1/telemetry/ping`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(ping),
		});
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

/**
 * Starts background location telemetry tracking with battery-optimized thresholds.
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

	connectTelemetrySocket(driverProfileId, tripId);

	const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
	if (!isRegistered) {
		await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
			accuracy: Location.Accuracy.High,
			timeInterval: 5000, // 5s interval
			distanceInterval: 10, // 10 meters
			deferredUpdatesInterval: 5000,
			showsBackgroundLocationIndicator: true,
			foregroundService: {
				notificationTitle: "Moja Driver — Live Trip Active",
				notificationBody: "Streaming live GPS vehicle telemetry to passengers and dispatchers.",
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
	disconnectTelemetrySocket();
}
