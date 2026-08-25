import AsyncStorage from "@react-native-async-storage/async-storage";
import MapboxGL from "@rnmapbox/maps";
import { parseCacheEntry, serializeCacheEntry } from "./mapbox-cache-core";

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

try {
	MapboxGL.setAccessToken(MAPBOX_PUBLIC_TOKEN);
} catch (err) {
	console.warn("[Mapbox] Failed to set access token:", err);
}

export interface RouteCoordinate {
	latitude: number;
	longitude: number;
}

export interface RouteDirectionsResult {
	geoJson: GeoJSON.FeatureCollection<GeoJSON.LineString>;
	/** Null = unknown (fallback corridor). Never fabricate a zero distance. */
	distanceMeters: number | null;
	/** Null = unknown (fallback corridor) — the ETA renders "—" honestly. */
	durationSeconds: number | null;
	/**
	 * Phase 30 (F-TM-17) — true when geometry is the terminal-to-terminal
	 * straight-line corridor (Directions API unreachable), NOT a road path.
	 * Consumers MUST label it as approximate.
	 */
	isApproximate: boolean;
}

// Phase 30 — v2 prefix orphans pre-TTL entries that were cached forever.
const ROUTE_CACHE_PREFIX = "moja_traveler_route_v2_";

export async function fetchTravelerRouteDirections(
	coordinates: RouteCoordinate[],
	cacheKey?: string,
): Promise<RouteDirectionsResult | null> {
	if (coordinates.length < 2) return null;

	// Check cache first (TTL enforced by the envelope's storedAt).
	if (cacheKey) {
		try {
			const raw = await AsyncStorage.getItem(
				`${ROUTE_CACHE_PREFIX}${cacheKey}`,
			);
			const entry = parseCacheEntry<RouteDirectionsResult>(raw, Date.now());
			if (entry?.fresh) return entry.result;
		} catch {}
	}

	try {
		const coordsString = coordinates
			.map((c) => `${c.longitude},${c.latitude}`)
			.join(";");

		// overview=simplified — preview polyline, not a navigation render.
		const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&overview=simplified&steps=false&access_token=${MAPBOX_PUBLIC_TOKEN}`;

		const response = await fetch(url);
		if (!response.ok) {
			return generateFallbackLineString(coordinates);
		}

		const data = await response.json();
		const route = data.routes?.[0];
		if (!route || !route.geometry) {
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

		if (cacheKey) {
			AsyncStorage.setItem(
				`${ROUTE_CACHE_PREFIX}${cacheKey}`,
				serializeCacheEntry(result, Date.now()),
			).catch(() => {});
		}

		return result;
	} catch {
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
