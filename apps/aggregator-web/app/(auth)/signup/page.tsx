import { SignupView } from "@/features/auth/views/signup-view";
import { redirectIfAuthenticated } from "@/lib/auth-server";

export const metadata = {
  title: "Create account",
};

export default async function SignupPage() {
  await redirectIfAuthenticated();

  return <SignupView />;
}