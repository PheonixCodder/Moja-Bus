"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Separator } from "@moja/ui/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ExternalLink,
  Inbox,
  Mail,
  MessageSquare,
  Search,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { InquiryDetailDrawer } from "@/features/admin/components/inquiries/inquiry-detail-drawer";
import { useTRPC } from "@/trpc/client";

export type InquiryStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface InquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: InquiryStatus;
  userId: string | null;
  user: { id: string; fullName: string; email: string; role: string } | null;
  ipAddress: string | null;
  userAgent: string | null;
  adminNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const STATUS_OPTIONS: Array<InquiryStatus | "All"> = [
  "All",
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export function AdminInquiriesView() {
  const t = useTranslations("adminDashboard.inquiries");
  const trpc = useTRPC();

  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });
  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "All",
  });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(10),
  );

  const { data } = useSuspenseQuery(
    trpc.contact.listInquiries.queryOptions({
      search: searchQuery || undefined,
      status:
        statusFilter === "All" ? undefined : (statusFilter as InquiryStatus),
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
  );

  const [selected, setSelected] = useState<InquiryRow | null>(null);

  const pageCount = Math.max(Math.ceil((data.total || 0) / pageSize), 1);

  const statusBadge = useMemo(
    () => (status: InquiryStatus) => {
      const styles: Record<InquiryStatus, string> = {
        NEW: "bg-blue-500/10 text-blue-600",
        IN_PROGRESS: "bg-amber-500/10 text-amber-600",
        RESOLVED: "bg-emerald-500/10 text-emerald-600",
        CLOSED: "bg-slate-500/10 text-slate-500",
      };
      const labels: Record<InquiryStatus, string> = {
        NEW: t("status.new"),
        IN_PROGRESS: t("status.inProgress"),
        RESOLVED: t("status.resolved"),
        CLOSED: t("status.closed"),
      };
      return (
        <Badge variant="secondary" className={styles[status]}>
          {labels[status]}
        </Badge>
      );
    },
    [t],
  );

  return (
    <div className="space-y-6">
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
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t("statusLabel")}
            </span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value || "All");
                setPage(1);
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-9 w-full sm:w-48 bg-white text-slate-800 text-xs"
                id="inquiries-status-filter"
              >
                <SelectValue placeholder={t("status.all")} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-md rounded">
                <SelectGroup>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "All"
                        ? t("status.all")
                        : t(
                            `status.${option.toLowerCase() as "new" | "inProgress" | "resolved" | "closed"}`,
                          )}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="bg-white border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[30%]">{t("table.subject")}</TableHead>
              <TableHead>{t("table.from")}</TableHead>
              <TableHead className="hidden md:table-cell">
                {t("table.contact")}
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                {t("table.received")}
              </TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-48 text-center">
                  <Inbox className="mx-auto size-10 text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">
                    {t("empty.title")}
                  </p>
                  <p className="text-sm text-slate-400">
                    {t("empty.description")}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(item as unknown as InquiryRow)}
                >
                  <TableCell>
                    <div className="flex items-start gap-2.5">
                      <MessageSquare className="size-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {item.subject}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-[240px]">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ee237c]/10 text-[#ee237c] text-[10px] font-bold shrink-0">
                        {item.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {item.name}
                        </p>
                        <Badge
                          variant="secondary"
                          className={
                            item.userId
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-slate-500/10 text-slate-500"
                          }
                        >
                          {item.userId ? t("badge.loggedIn") : t("badge.guest")}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3.5 text-slate-400" />
                        {item.email}
                      </span>
                      {item.phone && (
                        <span className="flex items-center gap-1.5">
                          <User className="size-3.5 text-slate-400" />
                          {item.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-slate-600 whitespace-nowrap">
                      {format(new Date(item.createdAt), "MMM d, yyyy h:mm a")}
                    </span>
                  </TableCell>
                  <TableCell>{statusBadge(item.status)}</TableCell>
                  <TableCell>
                    <ExternalLink className="size-4 text-slate-400" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex flex-col gap-4">
        <Separator />
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <span>{t("rowsPerPage")}</span>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="w-20"
                  id="inquiries-rows-per-page"
                >
                  <SelectValue placeholder={`${pageSize}`} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <span>
              {t("pageInfo", {
                current: Math.min(page, pageCount),
                count: pageCount,
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      </div>

      <InquiryDetailDrawer
        inquiry={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
