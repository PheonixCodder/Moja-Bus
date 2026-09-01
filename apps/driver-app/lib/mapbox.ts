import MapboxGL from "@rnmapbox/maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ROUTE_CACHE_TTL_MS,
  extractTripCoordinates,
  parseCacheEntry,
  serializeCacheEntry,
  type RawTripStopInput,
  type RouteCoordinate,
} from "./mapbox-cache-core";

export type { RawTripStopInput, RouteCoordinate };
export { extractTripCoordinates };

// P2-14 — fail LOUD when the token is missing in production builds.
export const MAPBOX_TOKEN_CONFIGURED = Boolean(
	process.env["EXPO_PUBLIC_MAPBOX_TOKEN"],
);

if (!MAPBOX_TOKEN_CONFIGURED && process.env.NODE_ENV === "production") {
	console.error(
		"[Mapbox] EXPO_PUBLIC_MAPBOX_TOKEN is not set. Maps will not render correctly in production builds.",
	);
}

// Dev-only dummy fallback so local development never hard-crashes.
export const MAPBOX_PUBLIC_TOKEN =
	process.env["EXPO_PUBLIC_MAPBOX_TOKEN"] ??
	"pk.eyJ1IjoibW9qYS1idXNzIiwiYSI6ImNtNWx4Z3dxZTBxY3Yya3B5ZjE1b250YXYifQ.dummy_dev_token";

// Initialize Mapbox token
try {
	MapboxGL.setAccessToken(MAPBOX_PUBLIC_TOKEN);
} catch (err) {
	console.warn("[Mapbox] Failed to set access token:", err);
}

export interface RouteDirectionsResult {
	geoJson: GeoJSON.FeatureCollection<GeoJSON.LineString>;
	/** Null = unknown (fallback corridor). Never fabricate a zero distance. */
	distanceMeters: number | null;
	/** Null = unknown (fallback corridor) — the ETA renders "—" honestly. */
	durationSeconds: number | null;
	/**
	 * Phase 30 (F-TM-17) — true when geometry is the terminal-to-terminal
	 * straight-line corridor (Directions API unreachable and no cache found),
	 * NOT a road path. Consumers MUST label it as approximate.
	 */
	isApproximate: boolean;
}

// Phase 30 — v2 prefix orphans pre-TTL entries that were cached forever.
const ROUTE_CACHE_PREFIX = "moja_route_cache_v2_";

/**
 * Reads route directions directly from AsyncStorage (Phase 3C / DRV-P2-11).
 * When allowStale is true, returns cached road geometry even if >24h old
 * (essential for offline dead-zone resilience).
 */
export async function getCachedRouteDirections(
	cacheKey: string,
	allowStale = true,
): Promise<RouteDirectionsResult | null> {
	try {
		const raw = await AsyncStorage.getItem(`${ROUTE_CACHE_PREFIX}${cacheKey}`);
		const entry = parseCacheEntry<RouteDirectionsResult>(raw, Date.now());
		if (entry?.fresh || (allowStale && entry?.result)) {
			return entry.result;
		}
	} catch {}
	return null;
}

/**
 * Pre-fetches and caches Mapbox route directions in the background (Phase 3C / DRV-P2-11).
 * If fresh cache exists, skips network fetch entirely (0 API credit cost).
 */
export async function prefetchTripRouteDirections(
	tripId: string,
	stopsOrCoords: readonly RawTripStopInput[] | RouteCoordinate[],
): Promise<RouteDirectionsResult | null> {
	const coords: RouteCoordinate[] =
		stopsOrCoords.length > 0 && "terminal" in stopsOrCoords[0]!
			? extractTripCoordinates(stopsOrCoords as readonly RawTripStopInput[])
			: (stopsOrCoords as RouteCoordinate[]);

	if (coords.length < 2) return null;
	const cacheKey = `trip_${tripId}`;

	// Skip network if fresh cache already present
	const fresh = await getCachedRouteDirections(cacheKey, false);
	if (fresh) return fresh;

	return fetchRouteDirections(coords, cacheKey);
}

/**
 * Fetches highway route directions from Mapbox Directions API, with a
 * 24 h TTL'd local cache and graceful offline stale-cache fallback.
 */
export async function fetchRouteDirections(
	coordinates: RouteCoordinate[],
	cacheKey?: string,
): Promise<RouteDirectionsResult | null> {
	if (coordinates.length < 2) return null;

	// Check cache first (TTL enforced by the envelope's storedAt).
	if (cacheKey) {
		const cached = await getCachedRouteDirections(cacheKey, false);
		if (cached) return cached;
	}

	try {
		const coordsString = coordinates
			.map((c) => `${c.longitude},${c.latitude}`)
			.join(";");

		// overview=simplified — this is a preview polyline, not a navigation
		// render; `full` was the most expensive tier for no visible gain.
		const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&overview=simplified&steps=false&access_token=${MAPBOX_PUBLIC_TOKEN}`;

		const response = await fetch(url);
		if (!response.ok) {
			if (cacheKey) {
				const stale = await getCachedRouteDirections(cacheKey, true);
				if (stale) return stale;
			}
			return generateFallbackLineString(coordinates);
		}

		const data = await response.json();
		const route = data.routes?.[0];
		if (!route?.geometry) {
			if (cacheKey) {
				const stale = await getCachedRouteDirections(cacheKey, true);
				if (stale) return stale;
			}
			return generateFallbackLineString(coordinates);
		}

		const result: RouteDirectionsResult = {
			geoJson: {
				type: "FeatureCollection",
				features: [
					{
						type: "Feature",
						properties: {},
						geometry: route.geometry,
					},
				],
			},
			distanceMeters: route.distance ?? null,
			durationSeconds: route.duration ?? null,
			isApproximate: false,
		};

		// Save to cache
		if (cacheKey) {
			AsyncStorage.setItem(
				`${ROUTE_CACHE_PREFIX}${cacheKey}`,
				serializeCacheEntry(result, Date.now()),
			).catch(() => {});
		}

		return result;
	} catch (err) {
		console.warn("[Mapbox Directions] Network error, checking stale cache fallback:", err);
		if (cacheKey) {
			const stale = await getCachedRouteDirections(cacheKey, true);
			if (stale) return stale;
		}
		return generateFallbackLineString(coordinates);
	}
}

/**
 * Straight-line corridor fallback. Distance/duration are NULL (unknown), and
 * isApproximate forces honest labeling downstream — never fake zeros.
 */
function generateFallbackLineString(
	coordinates: RouteCoordinate[],
): RouteDirectionsResult {
	return {
		geoJson: {
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					properties: {},
					geometry: {
						type: "LineString",
						coordinates: coordinates.map((c) => [c.longitude, c.latitude]),
					},
				},
			],
		},
		distanceMeters: null,
		durationSeconds: null,
		isApproximate: true,
	};
}
