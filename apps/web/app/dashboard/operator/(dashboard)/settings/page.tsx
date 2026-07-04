import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { OperatorSettingsView } from "@/features/operator/views/operator-settings-view";
import { OperatorQuickActions } from "@/features/operator/components/operator-quick-actions";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Company Settings - Moja Ride Operator Dashboard",
  description:
    "Manage company profile details, banking, compliance documents, and verification.",
};

export default async function OperatorSettingsPage() {
  await prefetch(trpc.operator.getSettings.queryOptions());

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Company</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Settings</span>
        </nav>
        <OperatorQuickActions />
      </header>
      <OperatorSettingsView />
    </HydrateClient>
  );
}
