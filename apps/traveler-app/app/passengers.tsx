import { PassengersView } from "@/features/settings/screens/passengers";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function PassengersScreen() {
	const isAuth = useRequireAuth("/passengers");
	if (!isAuth) return null;
	return <PassengersView />;
}
