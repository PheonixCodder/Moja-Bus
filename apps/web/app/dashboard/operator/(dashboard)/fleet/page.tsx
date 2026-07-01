import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { OperatorFleetView } from "@/features/operator/views/operator-fleet-view";
import { OperatorQuickActions } from "@/features/operator/components/operator-quick-actions";

export const metadata = {
  title: "Fleet Management — Moja Ride Operator",
  description:
    "Manage your vehicle fleet, view seat maps, and track maintenance statuses.",
};

export default function FleetPage() {
  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Operator</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Fleet</span>
        </nav>
        <OperatorQuickActions />
      </header>
      <OperatorFleetView />
    </>
  );
}
