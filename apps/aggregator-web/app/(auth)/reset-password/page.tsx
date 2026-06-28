import { redirect } from "next/navigation";
import { redirectIfAuthenticated } from "@/lib/auth-server";
import { ResetPasswordView } from "@/features/auth/views/reset-password-view";

type ResetPasswordPageProps = {
  searchParams: Promise<{ email?: string | undefined }>;
};

export const metadata = {
  title: "Reset password",
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  await redirectIfAuthenticated();

  const params = await searchParams;
  const email = params.email;

  if (!email) {
    redirect("/forgot-password");
  }

  return <ResetPasswordView email={email} />;
}
