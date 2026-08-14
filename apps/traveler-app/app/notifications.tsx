import { NotificationsView } from "@/features/settings/screens/notifications";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function NotificationsScreen() {
	const isAuth = useRequireAuth("/notifications");
	if (!isAuth) return null;
	return <NotificationsView />;
}
