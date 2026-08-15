import { ReferralsView } from "@/features/settings/screens/referrals";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function ReferralsScreen() {
  const isAuth = useRequireAuth("/referrals");
  if (!isAuth) return null;
  return <ReferralsView />;
}
