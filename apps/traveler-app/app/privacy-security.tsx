import { PrivacySecurityView } from "@/features/settings/screens/privacy-security";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function PrivacySecurityScreen() {
	const isAuth = useRequireAuth("/privacy-security");
	if (!isAuth) return null;
	return <PrivacySecurityView />;
}
