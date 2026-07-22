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
      <div className="flex flex-1 h-[calc(100vh-theme(spacing.12))] overflow-hidden bg-background">
        <div className="container max-w-7xl mx-auto flex h-full py-8 px-4 md:px-8">
          <div className="w-[280px] shrink-0 hidden md:block">
            <Suspense fallback={<div className="h-full border-r border-border" />}>
              <SettingsSidebar />
            </Suspense>
          </div>
          <div className="flex-1 overflow-y-auto pl-0 md:pl-8 pb-12">
            {children}
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
