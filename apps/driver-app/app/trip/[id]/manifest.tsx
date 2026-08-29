import { useLocalSearchParams } from "expo-router";
import { ManifestView } from "@/features/trips/screens/manifest-view";

export default function PassengerManifestScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <ManifestView tripId={id ?? ""} />;
}
