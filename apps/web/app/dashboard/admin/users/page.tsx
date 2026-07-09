import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";
import { AdminUsersView } from "@/features/admin/views/admin-users-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "User Directory — Moja Ride Admin",
  description:
    "List all platform travelers, operators, and staff. Manage user roles, search by profiles, and suspend operator companies.",
};

export default async function AdminUsersPage() {
  await prefetch(
    trpc.admin.listUsers.queryOptions({
      limit: 20,
      offset: 0,
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
          <span className="text-text-primary font-medium">User Directory</span>
        </nav>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
              User Directory
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              List all platform travelers, operators, and staff. Manage user roles, search by profiles, and suspend operator companies.
            </p>
          </div>
          <AdminUsersView />
        </div>
      </div>
    </HydrateClient>
  );
}
