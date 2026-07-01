import { redirectIfAuthenticated } from "@/lib/auth-server";
import { ForgotPasswordView } from "@/features/auth/views/forgot-password-view";

export const metadata = {
  title: "Forgot password",
};

export default async function ForgotPasswordPage() {
  await redirectIfAuthenticated();

  return <ForgotPasswordView />;
}
