import { getTranslations } from "next-intl/server";
import { DashboardView } from "@/features/dashboard/views/dashboard-view";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "passengerDashboard.overview" });
  return { title: t("metaTitle") };
}

export default function DashboardPage() {
  return <DashboardView />;
}