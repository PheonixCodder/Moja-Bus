"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Building,
  ChevronRight,
  ExternalLink,
  FileText,
  Landmark,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { OperatorOnboardingFunnel } from "../components/operator-onboarding-funnel";
import { VerificationsApproveDialog } from "../components/verifications-approve-dialog";
import {
  type CompanyRow,
  getCompanyColumns,
} from "../components/verifications-columns";
import { VerificationsPagination } from "../components/verifications-pagination";
import { VerificationsRejectDialog } from "../components/verifications-reject-dialog";
import { VerificationsTable } from "../components/verifications-table";

export function AdminVerificationsView() {
  const trpc = useTRPC();
  const router = useRouter();
  const t = useTranslations("adminDashboard.adminVerificationsView");
  const columnsT = useTranslations("adminDashboard.verificationsColumns");

  // Search parameters managed by nuqs
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });
  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "PENDING_VERIFICATION",
  });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(10),
  );

  const currentPage = page - 1; // 0-indexed for Prisma offset

  // Suspense Query for Companies
  const { data: verificationsData } = useSuspenseQuery(
    trpc.admin.listCompaniesForVerification.queryOptions({
      search: searchQuery || undefined,
      status: statusFilter === "ALL" ? undefined : (statusFilter as any),
      limit: pageSize,
      offset: currentPage * pageSize,
    }),
  );

  // Selected Row / Modal States
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(
    null,
  );
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReviewClick = (company: CompanyRow) => {
    router.push(`/dashboard/admin/verifications/${company.id}`);
  };

  const handleApproveClick = (company: CompanyRow) => {
    setSelectedCompany(company);
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
      t: columnsT,
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
              placeholder={t("searchPlaceholder")}
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
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t("status")}
            </span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value || "PENDING_VERIFICATION");
                setPage(1);
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-9 w-full sm:w-48 bg-white text-slate-800 text-xs"
                id="status-filter-select"
              >
                <SelectValue placeholder={t("allStatuses")} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-md rounded">
                <SelectGroup>
                  <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                  <SelectItem value="PENDING_VERIFICATION">
                    {t("pendingVerification")}
                  </SelectItem>
                  <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                  <SelectItem value="DRAFT">{t("draft")}</SelectItem>
                  <SelectItem value="REJECTED">{t("rejected")}</SelectItem>
                  <SelectItem value="SUSPENDED">{t("suspended")}</SelectItem>
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
