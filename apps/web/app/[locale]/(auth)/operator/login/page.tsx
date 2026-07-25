import { getTranslations } from "next-intl/server";
import { redirectIfAuthenticated } from "@/lib/auth-server";
import { OperatorLoginView } from "@/features/auth/views/operator-login-view";

type LoginPageProps = {
  searchParams: Promise<{ error?: string | undefined }>;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LoginPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.operator" });
  return { title: t("metaTitle") };
}

export default async function OperatorLoginPage({
  searchParams,
}: LoginPageProps) {
  await redirectIfAuthenticated();

  const params = await searchParams;

  return <OperatorLoginView errorCode={params.error} />;
}
