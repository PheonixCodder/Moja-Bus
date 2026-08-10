export interface LocationLabelParts {
	cityName: string | null | undefined;
	municipalityName?: string | null | undefined;
	quarterName?: string | null | undefined;
	isUrban: boolean;
}

export function formatLocationLabel({
	cityName,
	municipalityName,
	quarterName,
	isUrban,
}: LocationLabelParts): string {
	const muni =
		municipalityName && municipalityName !== cityName ? municipalityName : null;

	if (isUrban) {
		const base = muni ?? cityName ?? "";
		return quarterName ? `${base} – ${quarterName}` : base;
	}
	const city = cityName ?? "";
	if (!muni) return city;
	return quarterName
		? `${city} (${muni} - ${quarterName})`
		: `${city} (${muni})`;
}
