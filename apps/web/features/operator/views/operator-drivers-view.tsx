"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { Button } from "@moja/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  MapPin,
  MoreVertical,
  Plus,
  Radio,
  Route,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddDriverModal } from "@/features/operator/components/drivers/add-driver-modal";
import { DriverStatusBadge } from "@/features/operator/components/drivers/driver-status-badge";
import { LicenseExpiryBadge } from "@/features/operator/components/drivers/license-expiry-badge";
import { VerifyDriverDialog } from "@/features/operator/components/drivers/verify-driver-dialog";
import { useDebounce } from "@/features/operator/hooks/useDebounce";
import { useTRPC } from "@/trpc/client";

export function OperatorDriversView() {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  // Phase 27 (F-OP-15) — server-supported filters finally reachable from the UI.
  const [verificationFilter, setVerificationFilter] = useState<string>("ALL");
  const [employmentFilter, setEmploymentFilter] = useState<string>("ALL");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<{
    id: string;
    name: string;
    license: string;
  } | null>(null);

  const permissionsQuery = useQuery(trpc.drivers.getPermissions.queryOptions());
  const canManage =
    permissionsQuery.data?.canCreate || permissionsQuery.data?.canUpdate;
  const canVerify = permissionsQuery.data?.canVerify;

  // Phase 13 (F-OP-04) — accumulate pagination (marketplace pattern): rosters
  // larger than one page stay fully visible instead of silently truncated.
  const ROSTER_PAGE_SIZE = 50;
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<
    NonNullable<typeof driversQuery.data>["items"]
  >([]);
  const [lastFilterKey, setLastFilterKey] = useState("");
  const filterKey = `${debouncedSearch}|${statusFilter}|${categoryFilter}|${verificationFilter}|${employmentFilter}`;

  const driversQuery = useQuery({
    ...trpc.drivers.listDrivers.queryOptions({
      search: debouncedSearch || undefined,
      status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
      licenseCategory:
        categoryFilter !== "ALL" ? (categoryFilter as any) : undefined,
      verificationStatus:
        verificationFilter !== "ALL" ? (verificationFilter as any) : undefined,
      employmentType:
        employmentFilter !== "ALL" ? (employmentFilter as any) : undefined,
      page,
      limit: ROSTER_PAGE_SIZE,
    }),
    placeholderData: (prev) => prev,
  });

  // Reset accumulation when filters/search change
  if (filterKey !== lastFilterKey && !driversQuery.isLoading) {
    setLastFilterKey(filterKey);
    setPage(1);
    setAccumulated([]);
  }

  const incoming = driversQuery.data?.items ?? [];
  const total = driversQuery.data?.total ?? 0;

  // Merge without duplicates so refetches never double rows
  const knownIds = new Set(accumulated.map((d) => d.id));
  const newOnes = incoming.filter((d) => !knownIds.has(d.id));
  const drivers = page === 1 ? incoming : [...accumulated, ...newOnes];
  const hasMore = drivers.length < total;

  // P3-4 — server aggregates under the same filters; accurate beyond page 1.
  const stats = driversQuery.data?.stats;
  const onDutyCount = stats?.onDuty ?? 0;
  const verifiedCount = stats?.verified ?? 0;
  const pendingCount = stats?.pending ?? 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="size-7 text-primary" />
            Driver Fleet Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage commercial drivers, license verifications, performance
            reviews, and real-time trip allocations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard/operator/drivers/map">
            <Button variant="outline" className="gap-2">
              <Radio className="size-4 text-emerald-500 animate-pulse" />
              Live Fleet Map
            </Button>
          </Link>

          {canManage && (
            <Button onClick={() => setAddModalOpen(true)} className="gap-2">
              <Plus className="size-4" />
              Onboard Driver
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">
            Total Fleet Drivers
          </div>
          <div className="text-2xl font-bold mt-1">{total}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Active company affiliations
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">
            On Duty / Active
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {onDutyCount}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Available or on trip
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">
            Verified Licenses
          </div>
          <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
            {verifiedCount}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Compliance cleared
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">
            Pending Verification
          </div>
          <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
            {pendingCount}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Requires compliance review
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-xl border border-border bg-card">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, license, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(val: string | null) => {
              if (val) setStatusFilter(val);
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="ON_DUTY">On Duty</SelectItem>
              <SelectItem value="ON_TRIP">On Trip</SelectItem>
              <SelectItem value="RESTING">Resting</SelectItem>
              {/* Phase 27 (F-OP-15) — suspended drivers were previously
                  unreachable via the roster UI. */}
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="OFFLINE">Offline</SelectItem>
            </SelectContent>
          </Select>

          {/* Phase 27 (F-OP-15) — verification + contract-type filters, both
              already supported server-side. */}
          <Select
            value={verificationFilter}
            onValueChange={(val: string | null) => {
              if (val) setVerificationFilter(val);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Verification</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={employmentFilter}
            onValueChange={(val: string | null) => {
              if (val) setEmploymentFilter(val);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Contract Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Contracts</SelectItem>
              <SelectItem value="EXCLUSIVE_INTERCITY">
                Exclusive Intercity
              </SelectItem>
              <SelectItem value="CONTRACTOR_URBAN">Contractor Urban</SelectItem>
              <SelectItem value="HYBRID">Hybrid</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(val: string | null) => {
              if (val) setCategoryFilter(val);
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="License Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              <SelectItem value="D">Class D (Bus)</SelectItem>
              <SelectItem value="C">Class C (Heavy)</SelectItem>
              <SelectItem value="E">Class E (Coach)</SelectItem>
              <SelectItem value="B">Class B (Van)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drivers List Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {driversQuery.isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            Loading drivers roster...
          </div>
        ) : drivers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserCheck className="size-10 text-muted-foreground/40 mx-auto" />
            <div className="font-semibold text-foreground">
              No drivers found
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || statusFilter !== "ALL"
                ? "Try adjusting your search criteria or status filters."
                : "Get started by onboarding your commercial bus drivers to assign them to trips."}
            </p>
            {canManage && (
              <Button
                onClick={() => setAddModalOpen(true)}
                size="sm"
                className="mt-2"
              >
                Onboard First Driver
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {drivers.map((driver) => {
              const affiliation = driver.companyAffiliations[0];

              return (
                <div
                  key={driver.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
                >
                  {/* Driver Identity */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar className="size-11 border border-border">
                      <AvatarImage src={driver.user.image ?? undefined} />
                      <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">
                        {driver.user.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/operator/drivers/${driver.id}`}
                          className="font-bold text-base hover:underline text-foreground truncate"
                        >
                          {driver.user.fullName}
                        </Link>
                        <DriverStatusBadge status={driver.status} />
                        {/* Phase 14 (F-OP-03) — licence expiry visibility */}
                        <LicenseExpiryBadge
                          licenseExpiryDate={driver.licenseExpiryDate}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                        <span>
                          {driver.user.phoneNumber || driver.user.email}
                        </span>
                        <span>•</span>
                        <span className="font-mono font-medium">
                          Lic: {driver.licenseNumber} (Class{" "}
                          {driver.licenseCategory})
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="size-3 fill-amber-500" />
                          {driver.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Tags & Current Trip */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden md:block">
                      <div className="text-xs font-semibold text-foreground">
                        {affiliation?.employmentType === "EXCLUSIVE_INTERCITY"
                          ? "Intercity Exclusive"
                          : affiliation?.employmentType === "HYBRID"
                            ? "Hybrid (Multi-Mode)"
                            : "Urban Contractor"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {driver.currentTrip ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                            Bus {driver.currentTrip.bus.registrationPlate}
                          </span>
                        ) : (
                          "No active trip"
                        )}
                      </div>
                    </div>

                    {/* Verification Status */}
                    {driver.verificationStatus === "VERIFIED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="size-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <ShieldAlert className="size-3.5" />
                        Pending
                      </span>
                    )}

                    {/* Action Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/operator/drivers/${driver.id}`}
                          >
                            <ExternalLink className="size-4 mr-2" />
                            View Full Passport
                          </Link>
                        </DropdownMenuItem>

                        {canVerify &&
                          driver.verificationStatus !== "VERIFIED" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setVerifyTarget({
                                  id: driver.id,
                                  name: driver.user.fullName,
                                  license: driver.licenseNumber,
                                })
                              }
                            >
                              <ShieldCheck className="size-4 mr-2 text-emerald-500" />
                              Verify License
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}

            {/* Phase 13 (F-OP-04) — accumulate load-more */}
            {hasMore && (
              <div className="p-4 flex flex-col items-center gap-1.5 border-t border-border">
                <Button
                  variant="outline"
                  disabled={driversQuery.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {driversQuery.isFetching
                    ? "Loading…"
                    : `Load more (${total - drivers.length} remaining)`}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Showing {drivers.length} of {total} drivers
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddDriverModal open={addModalOpen} onOpenChange={setAddModalOpen} />

      {verifyTarget && (
        <VerifyDriverDialog
          open={!!verifyTarget}
          onOpenChange={(open) => !open && setVerifyTarget(null)}
          driverId={verifyTarget.id}
          driverName={verifyTarget.name}
          licenseNumber={verifyTarget.license}
        />
      )}
    </div>
  );
}
