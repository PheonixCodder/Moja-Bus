"use client";

import { useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger } from "nuqs";
import { useRouter } from "next/navigation";
import {
  Search,
  Building,
  ShieldCheck,
  FileText,
  ExternalLink,
  ChevronRight,
  User,
  Mail,
  Phone,
  Landmark,
  ShieldAlert,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Badge } from "@moja/ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";

import { VerificationsTable } from "../components/verifications-table";
import { getCompanyColumns, type CompanyRow } from "../components/verifications-columns";
import { VerificationsPagination } from "../components/verifications-pagination";
import { VerificationsApproveDialog } from "../components/verifications-approve-dialog";
import { VerificationsRejectDialog } from "../components/verifications-reject-dialog";
import { OperatorOnboardingFunnel } from "../components/operator-onboarding-funnel";

export function AdminVerificationsView() {
  const trpc = useTRPC();
  const router = useRouter();

  // Search parameters managed by nuqs
  const [searchQuery, setSearchQuery] = useQueryState("q", { defaultValue: "" });
  const [statusFilter, setStatusFilter] = useQueryState("status", { defaultValue: "PENDING_VERIFICATION" });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState("pageSize", parseAsInteger.withDefault(10));

  const currentPage = page - 1; // 0-indexed for Prisma offset

  // Suspense Query for Companies
  const { data: verificationsData } = useSuspenseQuery(
    trpc.admin.listCompaniesForVerification.queryOptions({
      search: searchQuery || undefined,
      status: statusFilter === "ALL" ? undefined : (statusFilter as any),
      limit: pageSize,
      offset: currentPage * pageSize,
    })
  );

  // Bank accounts codes query
  const { data: paystackBanks } = useQuery(
    trpc.payments.listBanks.queryOptions({})
  );

  // Selected Row / Modal States
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");

  const handleReviewClick = (company: CompanyRow) => {
    router.push(`/dashboard/admin/verifications/${company.id}`);
  };

  const handleApproveClick = (company: CompanyRow) => {
    setSelectedCompany(company);
    const pendingBank =
      company.bankAccounts?.find((b: any) => !b.isVerified) ||
      company.bankAccounts?.[0];
    
    const matchingBank = paystackBanks?.find(
      (b: any) =>
        pendingBank?.bankName
          ?.toLowerCase()
          ?.includes(b.name.split(" ")[0].toLowerCase())
    );
    setSelectedBankCode(pendingBank?.bankCode || matchingBank?.code || "");
    setIsApproveOpen(true);
  };

  const handleRejectClick = (company: CompanyRow) => {
    setSelectedCompany(company);
    setRejectionReason("");
    setIsRejectOpen(true);
  };

  // Configure React Table
  const table = useReactTable({
    data: (verificationsData?.items || []) as CompanyRow[],
    columns: getCompanyColumns({
      onReview: handleReviewClick,
      onApprove: handleApproveClick,
      onReject: handleRejectClick,
      isApproving: isApproveOpen,
    }),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((verificationsData?.total || 0) / pageSize),
  });

  return (
    <div className="space-y-6">
      {/* Onboarding Funnel Dashboard */}
      <OperatorOnboardingFunnel />

      {/* Filtering Options Grid */}
      <Card className="bg-white border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, tax ID, or rep..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value || "");
                setPage(1);
              }}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Building className="size-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value || "PENDING_VERIFICATION");
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="h-9 w-full sm:w-48 bg-white text-slate-800 text-xs" id="status-filter-select">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-md rounded">
                <SelectGroup>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <VerificationsTable table={table} />

      {/* Footer Pagination */}
      <VerificationsPagination
        page={page}
        pageSize={pageSize}
        total={verificationsData?.total || 0}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(1);
        }}
      />

      {/* Approval Dialog */}
      <VerificationsApproveDialog
        open={isApproveOpen}
        onOpenChange={setIsApproveOpen}
        selectedCompany={selectedCompany}
        selectedBankCode={selectedBankCode}
        setSelectedBankCode={setSelectedBankCode}
        paystackBanks={paystackBanks}
        onSuccess={() => setSelectedCompany(null)}
      />

      {/* Rejection Dialog */}
      <VerificationsRejectDialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        selectedCompany={selectedCompany}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onSuccess={() => setSelectedCompany(null)}
      />
    </div>
  );
}
