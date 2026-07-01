import { VerifyEmailView } from "@/features/auth/views/verify-email-view";

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string | undefined }>;
};

export const metadata = {
  title: "Verify email",
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;

  return <VerifyEmailView email={params.email} />;
}
