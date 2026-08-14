import { ReviewsView } from "@/features/settings/screens/reviews";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function ReviewsScreen() {
	const isAuth = useRequireAuth("/reviews");
	if (!isAuth) return null;
	return <ReviewsView />;
}
