import { expoClient } from "@better-auth/expo/client";

export function createExpoPlugin(
	config: Parameters<typeof expoClient>[0],
) {
	const raw = expoClient(config);
	return {
		id: "expo" as const,
		version: raw.version,
		fetchPlugins: raw.fetchPlugins,
		getActions(
			$fetch: any,
			$store: any,
			_options?: any,
		): ReturnType<(typeof raw)["getActions"]> {
			return raw.getActions($fetch, $store);
		},
	};
}