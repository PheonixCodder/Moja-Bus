import { redirectIfAuthenticated } from "@/lib/auth-server";
import { OperatorSignupView } from "@/features/auth/views/operator-signup-view";

export const metadata = {
  title: "Register Business - Moja Ride",
};

export default async function OperatorSignupPage() {
  await redirectIfAuthenticated();

  return <OperatorSignupView />;
}
