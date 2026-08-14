import { PersonalInfoView } from "@/features/settings/screens/personal-info";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function PersonalInfoScreen() {
	const isAuth = useRequireAuth("/personal-info");
	if (!isAuth) return null;
	return <PersonalInfoView />;
}
