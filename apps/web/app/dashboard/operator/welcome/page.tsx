import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth-server";
import { headers } from "next/headers";
import { trpc, getQueryClient, HydrateClient } from "@/trpc/server";
import {
  CheckCircle2,
  Building2,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Welcome to Moja Ride — Business Setup Complete",
  description:
    "Your operator business has been registered. Set up your operations while your account is under review.",
};

export default async function OperatorWelcomePage() {
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

  const companyName = (data.operator as any)?.company?.name ?? "Your Company";

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
                    Setup Complete!
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {companyName} has been successfully registered.
                  </p>
                </div>
              </div>

              {/* Status blocks */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Business Verification Submitted
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your documents and company information have been submitted
                      successfully.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Under Review
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Our team is reviewing your company profile. This usually
                      takes 1–3 business days. While you wait, you can begin
                      setting up your operations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Start Your Operations Setup
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add your terminals, fleet, routes, and schedules while
                      verification is in progress.
                    </p>
                  </div>
                </div>
              </div>

              {/* What you can set up now */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  What you can set up now
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Add your first terminal or depot",
                    "Register your vehicle fleet",
                    "Create intercity routes",
                    "Set up schedules and fares",
                  ].map((item) => (
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
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Questions? Contact{" "}
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
