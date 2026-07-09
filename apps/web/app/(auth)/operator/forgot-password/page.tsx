import { redirectIfAuthenticated } from "@/lib/auth-server";
import { OperatorForgotPasswordView } from "@/features/auth/views/operator-forgot-password-view";

export const metadata = {
  title: "Forgot Business Password - Moja Ride",
};

export default async function OperatorForgotPasswordPage() {
  await redirectIfAuthenticated();

  return <OperatorForgotPasswordView />;
}
