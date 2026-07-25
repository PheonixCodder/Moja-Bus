import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { AdminTravelersView } from "@/features/admin/views/admin-travelers-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Travelers Directory — Moja Ride Admin",
  description: "Manage platform travelers, verification status, and bookings.",
};

export default async function AdminTravelersPage() {
  await prefetch(
    trpc.admin.listUsers.queryOptions({
      limit: 20,
      offset: 0,
      role: "TRAVELER",
    })
  );

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Admin</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span>Users</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Travelers</span>
        </nav>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-[1400px]">
          <AdminTravelersView />
        </div>
      </div>
    </HydrateClient>
  );
}
