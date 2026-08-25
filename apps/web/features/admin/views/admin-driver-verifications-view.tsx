"use client";

import { useState } from "react";
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

export function AdminDriverVerificationsView() {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED"
  >("PENDING");
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "B" | "C" | "D" | "E"
  >("ALL");
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery(
    trpc.admin.listDriversForVerification.queryOptions({
      search: search.trim() || undefined,
      status: statusFilter,
      licenseCategory: categoryFilter === "ALL" ? undefined : categoryFilter,
      limit: 50,
      offset: 0,
    })
  );

  const drivers = data?.drivers ?? [];
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
              ? "bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Pending Review
            </span>
            <Clock className="size-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black font-display text-slate-900 mt-2">
            {counts.pending}
          </p>
          <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">
            Requires immediate inspection
          </span>
        </div>

        {/* Verified Card */}
        <div
          onClick={() => setStatusFilter("VERIFIED")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "VERIFIED"
              ? "bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Verified Active
            </span>
            <CheckCircle className="size-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-black font-display text-slate-900 mt-2">
            {counts.verified}
          </p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            Platform compliant
          </span>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "REJECTED"
              ? "bg-rose-500/10 border-rose-500 shadow-md shadow-rose-500/10"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Rejected / Incomplete
            </span>
            <XCircle className="size-5 text-rose-500" />
          </div>
          <p className="text-3xl font-black font-display text-slate-900 mt-2">
            {counts.rejected}
          </p>
          <span className="text-xs text-rose-600 font-semibold mt-1 inline-block">
            Feedback dispatched
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by driver name, phone, or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(val: any) => setStatusFilter(val)}
          >
            <SelectTrigger className="w-[140px] bg-slate-50">
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
            <SelectTrigger className="w-[140px] bg-slate-50">
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
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70">
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
                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                  Loading verification queue...
                </TableCell>
              </TableRow>
            ) : drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <ShieldCheck className="size-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm">No driver applications found.</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {statusFilter === "PENDING"
                      ? "All submitted driver licenses have been reviewed."
                      : "Try changing your search or filter parameters."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id} className="hover:bg-slate-50/50">
                  {/* Driver Name & Phone */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-600 border">
                        {driver.user?.image ? (
                          <img
                            src={driver.user.image}
                            alt={driver.user.fullName}
                            className="size-full object-cover"
                          />
                        ) : (
                          <User className="size-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">
                          {driver.user?.fullName ?? "Unnamed Driver"}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {driver.user?.phoneNumber ?? "No phone"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* License Info */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1">
                        <CreditCard className="size-3.5 text-slate-400" />
                        {driver.licenseNumber}
                      </p>
                      <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0">
                        Class {driver.licenseCategory}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Carrier */}
                  <TableCell>
                    <p className="text-xs font-semibold text-slate-800">
                      {driver.companyAffiliations?.[0]?.company?.name ?? (
                        <span className="text-slate-400 italic">Independent Pool</span>
                      )}
                    </p>
                  </TableCell>

                  {/* Experience */}
                  <TableCell>
                    <span className="text-xs font-medium text-slate-600">
                      {driver.yearsOfExperience} yrs
                    </span>
                  </TableCell>

                  {/* Verification Status */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        driver.verificationStatus === "VERIFIED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : driver.verificationStatus === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {driver.verificationStatus}
                    </Badge>
                  </TableCell>

                  {/* Submission Date */}
                  <TableCell className="text-xs text-slate-500">
                    {new Date(driver.createdAt).toLocaleDateString()}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDossier(driver)}
                      className="gap-1.5 font-semibold text-xs border-slate-300 hover:bg-slate-100"
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
