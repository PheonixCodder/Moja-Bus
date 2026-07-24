import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { SettingsSidebar } from "@/features/operator/settings/components/settings-sidebar";
import { Suspense } from "react";
import { SettingsSectionSkeleton } from "@/features/operator/settings/components/ui/settings-skeleton";

export const metadata = {
  title: "Company Settings - Moja Ride Operator Dashboard",
  description: "Manage company profile details, banking, compliance documents, and verification.",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await prefetch(trpc.operator.getSettings.queryOptions());

  return (
    <HydrateClient>
      <div className="flex flex-1 min-h-[calc(100vh-theme(spacing.12))] bg-background">
        <div className="container max-w-7xl mx-auto flex flex-col md:flex-row h-full py-6 md:py-8 px-4 md:px-8">
          <div className="w-full md:w-[280px] shrink-0">
            <Suspense fallback={<div className="h-full border-r border-border" />}>
              <SettingsSidebar />
            </Suspense>
          </div>
          <div className="flex-1 min-w-0 pt-0 md:pl-8 pb-12">
            {children}
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
