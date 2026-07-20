import { LoginView } from "@/features/auth/views/login-view";
import { redirectIfAuthenticated, getUser } from "@/lib/auth-server";
import { getSafeCallbackUrl } from "@/features/auth/lib/safe-callback-url";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | undefined;
    callbackUrl?: string | undefined;
  }>;
};

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  await redirectIfAuthenticated(params.callbackUrl);

  const user = await getUser();
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl, "/dashboard");

  const initialStep =
    user && user.role === "TRAVELER" && !user.name ? "profile" : "input";

  return (
    <LoginView
      errorCode={params.error}
      initialStep={initialStep}
      initialUser={
        user
          ? { email: user.email, ...(user.phone ? { phone: user.phone } : {}) }
          : undefined
      }
      callbackUrl={callbackUrl}
    />
  );
}
