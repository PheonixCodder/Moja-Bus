import { OperatorVerifyEmailView } from "@/features/auth/views/operator-verify-email-view";

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string | undefined }>;
};

export const metadata = {
  title: "Verify Business Email - Moja Ride",
};

export default async function OperatorVerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;

  return <OperatorVerifyEmailView email={params.email} />;
}
