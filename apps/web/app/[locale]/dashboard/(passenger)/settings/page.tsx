import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { PassengerSettingsView } from "@/features/passenger/views/passenger-settings-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { PageTitleHeader } from "@/features/dashboard/components/page-title-header";
import { detectCountryFromHeaders } from "@/lib/phone/detect-country";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "passengerDashboard.settings",
  });
  return { title: t("metaTitle") };
}

export default async function SettingsPage() {
  const t = await getTranslations("passengerDashboard.settings");

  await prefetch(trpc.passenger.getPreferences.queryOptions());

  const detectedCountry = detectCountryFromHeaders(await headers());

  return (
    <HydrateClient>
      <div className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <PageTitleHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
        />
        <PassengerSettingsView detectedCountry={detectedCountry} />
      </div>
    </HydrateClient>
  );
}
