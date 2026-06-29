import { redirect } from "next/navigation";
import { redirectIfOperatorAuthenticated } from "@/lib/auth-server";
import { OperatorResetPasswordView } from "@/features/auth/views/operator-reset-password-view";

type ResetPasswordPageProps = {
  searchParams: Promise<{ email?: string | undefined }>;
};

export const metadata = {
  title: "Reset Business Password - Moja Ride",
};

export default async function OperatorResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  await redirectIfOperatorAuthenticated();

  const params = await searchParams;
  const email = params.email;

  if (!email) {
    redirect("/operator/forgot-password");
  }

  return <OperatorResetPasswordView email={email} />;
}
