import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { LangSetter } from "@/components/lang-setter";
import { PostHogProvider } from "@/components/posthog-provider";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/types";
import { TRPCReactProvider } from "@/trpc/client";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

  return {
    // Resolves relative OG/Twitter image paths (blog, home, …) against the
    // production origin so social previews don't fall back to localhost.
    metadataBase: new URL(baseUrl),
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
    icons: {
      icon: [
        { url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/images/apple-touch-icon.png",
      shortcut: "/images/favicon.ico",
    },
    manifest: "/images/site.webmanifest",
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      siteName: process.env["NEXT_PUBLIC_APP_NAME"] ?? "Moja Ride",
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
          <PostHogProvider>
            <LangSetter />
            <Toaster />
            {children}
          </PostHogProvider>
        </NuqsAdapter>
      </TRPCReactProvider>
    </NextIntlClientProvider>
  );
}
