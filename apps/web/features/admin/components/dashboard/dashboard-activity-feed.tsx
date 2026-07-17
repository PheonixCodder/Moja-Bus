"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Building2, Ticket, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";

interface RecentCompany {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
}

interface RecentBooking {
  id: string;
  bookingReference: string;
  passengerName: string;
  farePaid: number;
  createdAt: Date;
  company: { name: string };
}

interface DashboardActivityFeedProps {
  recentCompanies: RecentCompany[];
  recentBookings: RecentBooking[];
}

function statusVariant(status: string) {
  if (status === "ACTIVE") return "bg-green-500/10 text-green-700 border-green-200";
  if (status === "PENDING_VERIFICATION") return "bg-amber-500/10 text-amber-700 border-amber-200";
  if (status === "REJECTED") return "bg-red-500/10 text-red-700 border-red-200";
  return "bg-muted text-muted-foreground";
}

function statusLabel(status: string) {
  if (status === "PENDING_VERIFICATION") return "Pending";
  if (status === "ACTIVE") return "Active";
  if (status === "REJECTED") return "Rejected";
  return status;
}

export function DashboardActivityFeed({
  recentCompanies,
  recentBookings,
}: DashboardActivityFeedProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Recent Operator Signups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Recent Operators</CardTitle>
          <CardDescription>Latest company registrations</CardDescription>
          <Button variant="ghost" size="sm" className="ml-auto h-7 px-2"
            nativeButton={false}
            render={<Link href="/dashboard/admin/verifications" />}
          >
            View all <ArrowRight className="ml-1 size-3" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No operators yet</p>
          ) : (
            recentCompanies.map((company) => (
              <div key={company.id} className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                  <Building2 className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{company.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(company.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 shrink-0 ${statusVariant(company.status)}`}
                >
                  {statusLabel(company.status)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Recent Bookings</CardTitle>
          <CardDescription>Latest confirmed ticket purchases</CardDescription>
          <Button variant="ghost" size="sm" className="ml-auto h-7 px-2"
            nativeButton={false}
            render={<Link href="/dashboard/admin/operations/trips" />}
          >
            View all <ArrowRight className="ml-1 size-3" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No bookings yet</p>
          ) : (
            recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Ticket className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {booking.bookingReference} · {booking.passengerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.company.name} ·{" "}
                    {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">
                  {booking.farePaid.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-muted-foreground">XOF</span>
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
