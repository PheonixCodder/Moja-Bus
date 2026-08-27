import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { LoginView } from "@/features/auth/views/login-view";
import { redirectIfAuthenticated, getUser } from "@/lib/auth-server";
import { getSafeCallbackUrl } from "@/features/auth/lib/safe-callback-url";
import { detectCountryFromHeaders } from "@/lib/phone/detect-country";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | undefined;
    callbackUrl?: string | undefined;
  }>;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LoginPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.passenger" });
  return { title: t("loginTitle") };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  await redirectIfAuthenticated(params.callbackUrl);

  const user = await getUser();
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl, "/dashboard");

  const detectedCountry = detectCountryFromHeaders(await headers());

  const initialStep =
    user && user.role === "TRAVELER" && !user.name ? "profile" : "input";

  return (
    <LoginView
      errorCode={params.error}
      initialStep={initialStep}
      initialUser={
        user
          ? {
              email: user.email,
              ...(user.phoneNumber ? { phone: user.phoneNumber } : {}),
            }
          : undefined
      }
      callbackUrl={callbackUrl}
      detectedCountry={detectedCountry}
    />
  );
}
