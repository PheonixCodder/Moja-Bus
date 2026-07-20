import * as React from "react";
import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { NotificationInbox } from "@/features/notifications/components/notification-inbox";
import { OperatorQuickActions } from "@/features/operator/components/operator-quick-actions";
import { OperatorSearchDialog } from "./operator-search-dialog";

export function OperatorDashboardHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b sticky top-0 z-50 bg-background/50 backdrop-blur-md transition-all">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
          />
          <OperatorSearchDialog />
        </div>
        <div className="flex items-center gap-2">
          <OperatorQuickActions />
          <div className="h-4 w-px bg-border/80 mx-1" />
          <NotificationInbox />
        </div>
      </div>
    </header>
  );
}
