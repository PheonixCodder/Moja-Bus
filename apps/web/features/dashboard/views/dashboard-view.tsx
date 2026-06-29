import { BusFront, CalendarDays, Ticket, Bookmark } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { SessionsPanel } from "@/features/dashboard/components/sessions-panel";
import type { CustomUser } from "@/lib/auth-client";
import { getUser } from "@/lib/auth-server";

const stats = [
  {
    title: "Upcoming trips",
    value: "0",
    icon: BusFront,
  },
  {
    title: "Active bookings",
    value: "0",
    icon: CalendarDays,
  },
  {
    title: "Digital tickets",
    value: "0",
    icon: Ticket,
  },
  {
    title: "Saved routes",
    value: "0",
    icon: Bookmark,
  },
];

export async function DashboardView() {
  const user = await getUser();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Dashboard" className="lg:hidden" />

      <div className="flex flex-1 flex-col gap-8 p-4 lg:p-8">
        <div className="hidden lg:block">
          <DashboardHeader user={user} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border bg-bg-surface">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  {stat.title}
                </CardTitle>
                <stat.icon className="size-4 text-text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight text-text-primary">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <SessionsPanel />
      </div>
    </div>
  );
}
