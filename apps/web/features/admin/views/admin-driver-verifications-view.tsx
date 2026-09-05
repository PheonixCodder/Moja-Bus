"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import {
  ShieldCheck,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Eye,
  User,
  CreditCard,
} from "lucide-react";
import { DriverVerificationDialog } from "../components/drivers/driver-verification-dialog";

/** Local 300ms debounce — keeps keystrokes from firing full queue fetches. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function AdminDriverVerificationsView() {
  const trpc = useTRPC();
  // Phase-2 audit (gap #4 / F6): the old fixed limit:50/offset:0 silently
  // truncated the queue past 50 rows. Accumulating load-more (roster/marketplace
  // pattern) keeps every pending application reachable; search is debounced so
  // keystrokes stop firing full fetches.
  const PAGE_SIZE = 50;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED"
  >("PENDING");
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "B" | "C" | "D" | "E"
  >("ALL");
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<
    NonNullable<typeof data>["drivers"]
  >([]);
  const [lastFilterKey, setLastFilterKey] = useState("");
  const filterKey = `${debouncedSearch.trim()}|${statusFilter}|${categoryFilter}`;

  const { data, isLoading } = useQuery(
    trpc.admin.listDriversForVerification.queryOptions({
      search: debouncedSearch.trim() || undefined,
      status: statusFilter,
      licenseCategory: categoryFilter === "ALL" ? undefined : categoryFilter,
      limit: PAGE_SIZE,
      offset,
    }),
  );

  // Reset accumulation when any filter changes (same guarded render-time
  // reset as the operator roster view).
  if (filterKey !== lastFilterKey && !isLoading) {
    setLastFilterKey(filterKey);
    setOffset(0);
    setAccumulated([]);
  }

  const incoming = data?.drivers ?? [];
  const total = data?.total ?? 0;
  const knownIds = new Set(accumulated.map((d) => d.id));
  const freshRows = incoming.filter((d) => !knownIds.has(d.id));
  const drivers = offset === 0 ? incoming : [...accumulated, ...freshRows];
  const hasMore = drivers.length < total;

  const counts = data?.counts ?? { pending: 0, verified: 0, rejected: 0 };

  const handleOpenDossier = (driver: any) => {
    setSelectedDriver(driver);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* KPI Counters Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Card */}
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "PENDING"
              ? "bg-warning/10 border-warning shadow-md"
              : "bg-card border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Pending Review
            </span>
            <Clock className="size-5 text-warning" />
          </div>
          <p className="text-3xl font-black font-display text-foreground mt-2">
            {counts.pending}
          </p>
          <span className="text-xs text-warning font-semibold mt-1 inline-block">
            Requires immediate inspection
          </span>
        </div>

        {/* Verified Card */}
        <div
          onClick={() => setStatusFilter("VERIFIED")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "VERIFIED"
              ? "bg-success/10 border-success shadow-md"
              : "bg-card border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Verified Active
            </span>
            <CheckCircle className="size-5 text-success" />
          </div>
          <p className="text-3xl font-black font-display text-foreground mt-2">
            {counts.verified}
          </p>
          <span className="text-xs text-success font-semibold mt-1 inline-block">
            Platform compliant
          </span>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "REJECTED"
              ? "bg-destructive/10 border-destructive shadow-md"
              : "bg-card border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Rejected / Incomplete
            </span>
            <XCircle className="size-5 text-destructive" />
          </div>
          <p className="text-3xl font-black font-display text-foreground mt-2">
            {counts.rejected}
          </p>
          <span className="text-xs text-destructive font-semibold mt-1 inline-block">
            Feedback dispatched
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by driver name, phone, or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-input"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(val: any) => setStatusFilter(val)}
          >
            <SelectTrigger className="w-36 bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(val: any) => setCategoryFilter(val)}
          >
            <SelectTrigger className="w-36 bg-background">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              <SelectItem value="D">Class D (Bus)</SelectItem>
              <SelectItem value="E">Class E (Coach)</SelectItem>
              <SelectItem value="C">Class C (Truck)</SelectItem>
              <SelectItem value="B">Class B (Minibus)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Driver Verifications Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Driver</TableHead>
              <TableHead>License Details</TableHead>
              <TableHead>Carrier Affiliation</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  Loading verification queue...
                </TableCell>
              </TableRow>
            ) : drivers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  <ShieldCheck className="size-10 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-foreground">
                    No driver applications found.
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {statusFilter === "PENDING"
                      ? "All submitted driver licenses have been reviewed."
                      : "Try changing your search or filter parameters."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id} className="hover:bg-muted/50">
                  {/* Driver Name & Phone */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-muted overflow-hidden flex items-center justify-center font-bold text-xs text-foreground border border-border">
                        {driver.user?.image ? (
                          <img
                            src={driver.user.image}
                            alt={driver.user.fullName}
                            className="size-full object-cover"
                          />
                        ) : (
                          <User className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">
                          {driver.user?.fullName ?? "Unnamed Driver"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {driver.user?.phoneNumber ?? "No phone"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* License Info */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-mono text-xs font-bold text-foreground flex items-center gap-1">
                        <CreditCard className="size-3.5 text-muted-foreground" />
                        {driver.licenseNumber}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs font-bold px-1.5 py-0"
                      >
                        Class {driver.licenseCategory}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Carrier */}
                  <TableCell>
                    <p className="text-xs font-semibold text-foreground">
                      {driver.companyAffiliations?.[0]?.company?.name ?? (
                        <span className="text-muted-foreground italic">
                          Independent Pool
                        </span>
                      )}
                    </p>
                  </TableCell>

                  {/* Experience */}
                  <TableCell>
                    <span className="text-xs font-medium text-muted-foreground">
                      {driver.yearsOfExperience} yrs
                    </span>
                  </TableCell>

                  {/* Verification Status */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        driver.verificationStatus === "VERIFIED"
                          ? "bg-success/15 text-success border-success/30"
                          : driver.verificationStatus === "REJECTED"
                            ? "bg-destructive/15 text-destructive border-destructive/30"
                            : "bg-warning/15 text-warning border-warning/30"
                      }
                    >
                      {driver.verificationStatus}
                    </Badge>
                  </TableCell>

                  {/* Submission Date */}
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(driver.createdAt).toLocaleDateString()}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDossier(driver)}
                      className="gap-1.5 font-semibold text-xs border-border hover:bg-muted/50"
                    >
                      <Eye className="size-3.5" />
                      Review Dossier
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Phase-2 audit — accumulate load-more */}
        {hasMore && (
          <div className="p-4 border-t border-border flex flex-col items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              {isLoading
                ? "Loading…"
                : `Load more (${total - drivers.length} remaining)`}
            </Button>
            <span className="text-xs text-muted-foreground">
              Showing {drivers.length} of {total}
            </span>
          </div>
        )}
      </div>

      {/* Interactive Dossier Modal */}
      <DriverVerificationDialog
        driver={selectedDriver}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
