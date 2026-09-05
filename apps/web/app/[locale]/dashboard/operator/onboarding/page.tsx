import { redirect } from "next/navigation";
import { OperatorOnboardingView } from "@/features/operator/views/operator-onboarding-view";
import { trpc, getQueryClient, HydrateClient } from "@/trpc/server";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OperatorOnboardingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding" });
  const queryClient = getQueryClient();
  const [data] = await Promise.all([
    queryClient.fetchQuery(trpc.operator.getOnboardingStatus.queryOptions()),
  ]);

  if (data && data.onboardingStatus === "COMPLETED") {
    redirect("/dashboard/operator");
  }

  return (
    <HydrateClient>
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground font-display">
                {t("headerTitle")}
              </h1>
              <p className="text-xs text-muted-foreground">{t("headerSubtitle")}</p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-card rounded-md border border-border p-8 shadow-sm">
            <OperatorOnboardingView />
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
