import { LoginView } from "@/features/auth/views/login-view";
import { redirectIfAuthenticated, getUser } from "@/lib/auth-server";

type LoginPageProps = {
  searchParams: Promise<{ error?: string | undefined }>;
};

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();

  const params = await searchParams;
  const user = await getUser();

  // If traveler is already logged in but has no name, boot directly into profile onboarding
  const initialStep = (user && user.role === "TRAVELER" && !user.name)
    ? "profile"
    : "input";

  return (
    <LoginView
      errorCode={params.error}
      initialStep={initialStep}
      initialUser={user ? { email: user.email, ...(user.phone ? { phone: user.phone } : {}) } : undefined}
    />
  );
}
