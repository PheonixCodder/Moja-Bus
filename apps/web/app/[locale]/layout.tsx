import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "@/trpc/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { routing } from "@/i18n/routing";
import { LangSetter } from "@/components/lang-setter";
import type { Locale } from "@/i18n/types";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale — returns 404 for any unrecognised segment
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Load messages server-side (never sent to client bundle unless used in CC)
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <TRPCReactProvider>
        <NuqsAdapter>
          <LangSetter />
          <Toaster />
          {children}
        </NuqsAdapter>
      </TRPCReactProvider>
    </NextIntlClientProvider>
  );
}
