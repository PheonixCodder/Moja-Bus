"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { format } from "date-fns";
import {
  Calendar, CreditCard, MapPin, Monitor,
  Users, Ticket, Star,
} from "lucide-react";

import { Badge } from "@moja/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { UserProfileHeader } from "../components/user-profile-header";
import { cn } from "@moja/ui/lib/utils";

const bookingStatusMeta: Record<string, { label: string; className: string }> = {
  CONFIRMED:       { label: "Confirmed",       className: "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  PENDING_PAYMENT: { label: "Pending Payment", className: "bg-amber-100/60 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  CANCELLED:       { label: "Cancelled",       className: "bg-red-100/60 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  EXPIRED:         { label: "Expired",         className: "bg-zinc-100/60 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400" },
  COMPLETED:       { label: "Completed",       className: "bg-blue-100/60 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

export function AdminTravelerProfileView({ userId }: { userId: string }) {
  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.admin.getUserProfile.queryOptions({ userId }));

  const confirmedBookings = user.bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <UserProfileHeader
        id={user.id}
        fullName={user.fullName}
        email={user.email}
        phone={user.phone}
        role={user.role as "TRAVELER"}
        emailVerified={user.emailVerified}
        createdAt={user.createdAt}
        backHref="/dashboard/admin/users/travelers"
        backLabel="Back to Travelers"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: user.bookings.length, icon: Ticket },
          { label: "Confirmed", value: confirmedBookings, icon: Calendar },
          { label: "Saved Passengers", value: user.passengerProfile?.savedPassengers?.length ?? 0, icon: Users },
          { label: "Active Sessions", value: user.sessions.length, icon: Monitor },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-2xl font-bold">{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking History */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {user.bookings.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">No bookings yet</div>
            ) : (
              <div className="divide-y">
                {user.bookings.map((booking) => {
                  const route = booking.trip?.schedule?.route;
                  const origin = route?.originTerminal?.city || route?.originTerminal?.name || "—";
                  const dest = route?.destTerminal?.city || route?.destTerminal?.name || "—";
                  const meta = bookingStatusMeta[booking.status] ?? bookingStatusMeta["EXPIRED"]!;

                  return (
                    <div key={booking.id} className="px-6 py-3 flex items-center justify-between gap-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate">
                          {origin} → {dest}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {booking.company.name}
                          <span className="opacity-40">·</span>
                          {format(booking.createdAt, "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-foreground">
                          {booking.farePaid.toLocaleString()} XOF
                        </span>
                        <Badge variant="outline" className={cn("border-0 text-[11px] px-2", meta.className)}>
                          {meta.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Account Details */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "User ID", value: user.id.slice(0, 16) + "…" },
                { label: "Email Verified", value: user.emailVerified ? "Yes" : "No" },
                { label: "Work Email", value: user.workEmail || "—" },
                { label: "Work Phone", value: user.workPhone || "—" },
                { label: "Marketing Opt-in", value: user.passengerProfile?.marketingOptIn ? "Yes" : "No" },
                { label: "Joined", value: format(user.createdAt, "PPP") },
                { label: "Last Updated", value: format(user.updatedAt, "PPP") },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="font-medium text-right truncate">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Saved Passengers */}
          {(user.passengerProfile?.savedPassengers?.length ?? 0) > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Saved Passengers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {user.passengerProfile!.savedPassengers.map((p) => (
                    <div key={p.id} className="px-6 py-3 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{p.fullName}</span>
                        {p.isSelf && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Self</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">{p.phone}</span>
                      {p.label && <span className="text-xs text-muted-foreground italic">{p.label}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sessions */}
          {user.sessions.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {user.sessions.map((s) => (
                    <div key={s.id} className="px-6 py-3 flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-medium truncate w-full" title={s.userAgent || "Unknown device"}>
                        {s.userAgent || "Unknown device"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 overflow-hidden">
                        <Monitor className="h-3 w-3 shrink-0" />
                        <span className="truncate">{s.ipAddress || "Unknown IP"}</span>
                        <span className="opacity-40 shrink-0">·</span>
                        <span className="shrink-0">{format(s.createdAt, "MMM d, HH:mm")}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
