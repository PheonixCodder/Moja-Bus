import { WalletView } from "@/features/settings/screens/wallet";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function WalletScreen() {
	const isAuth = useRequireAuth("/wallet");
	if (!isAuth) return null;
	return <WalletView />;
}
