import Link from "next/link";
import { redirectIfOperatorAuthenticated } from "@/lib/auth-server";
import { OperatorLoginView } from "@/features/auth/views/operator-login-view";

type LoginPageProps = {
  searchParams: Promise<{ error?: string | undefined }>;
};

export const metadata = {
  title: "Business Sign In - Moja Ride",
};

export default async function OperatorLoginPage({ searchParams }: LoginPageProps) {
  await redirectIfOperatorAuthenticated();

  const params = await searchParams;

  return <OperatorLoginView errorCode={params.error} />;
}
