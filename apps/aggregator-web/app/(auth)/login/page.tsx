import { LoginView } from "@/features/auth/views/login-view";
import { redirectIfAuthenticated } from "@/lib/auth-server";

type LoginPageProps = {
  searchParams: Promise<{ error?: string | undefined }>;
};

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();

  const params = await searchParams;

  return <LoginView errorCode={params.error} />;
}
