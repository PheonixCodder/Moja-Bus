import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth-server";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { trpc, getQueryClient, HydrateClient } from "@/trpc/server";
import {
  CheckCircle2,
  Building2,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "welcome" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function OperatorWelcomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "welcome" });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) redirect("/operator/login");

  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery(
    trpc.operator.getOnboardingStatus.queryOptions(),
  );

  // If onboarding is not yet complete, redirect back
  if (!data || data.onboardingStatus !== "COMPLETED") {
    redirect("/dashboard/operator/onboarding");
  }

  const companyName = data.operator?.company?.name ?? t("companyFallback");

  return (
    <HydrateClient>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Card */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-green-500" />

            <div className="p-8 space-y-6">
              {/* Icon + heading */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {t("title")}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("subtitle", { companyName })}
                  </p>
                </div>
              </div>

              {/* Status blocks */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {t("verificationSubmitted.title")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("verificationSubmitted.desc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {t("underReview.title")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("underReview.desc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {t("startOperations.title")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("startOperations.desc")}
                    </p>
                  </div>
                </div>
              </div>

              {/* What you can set up now */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t("whatYouCanSetup")}
                </p>
                <ul className="space-y-1.5">
                  {(t.raw("setupItems") as string[]).map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-xs text-foreground"
                    >
                      <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <Link
                href="/dashboard/operator"
                className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-bold text-sm py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t("goToDashboard")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {t("footerText")}
            <a
              href="mailto:support@mojaride.com"
              className="text-primary hover:underline"
            >
              support@mojaride.com
            </a>
          </p>
        </div>
      </div>
    </HydrateClient>
  );
}
