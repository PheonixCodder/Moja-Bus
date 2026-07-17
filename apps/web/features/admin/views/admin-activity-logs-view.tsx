"use client";

import { useState, Suspense } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { Input } from "@moja/ui/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Card } from "@moja/ui/components/ui/card";
import { ActivityLogsTable } from "../components/audit/activity-logs-table";
import { Spinner } from "@moja/ui/components/ui/spinner";

const CHANNELS = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "in_app", label: "In-App" },
  { value: "push", label: "Push" },
  { value: "chat", label: "Chat" },
];

const TEMPLATE_OPTIONS = [
  // Auth
  { value: "auth-otp", label: "Auth OTP" },
  { value: "operator-signup-otp", label: "Operator Signup OTP" },
  { value: "operator-welcome", label: "Operator Welcome" },
  { value: "operator-staff-invite", label: "Staff Invite" },
  { value: "staff-acceptance-alert", label: "Staff Acceptance Alert" },
  // Payments
  { value: "passenger-booking-confirmed", label: "Booking Confirmed" },
  { value: "passenger-booking-refunded", label: "Booking Refunded" },
  { value: "passenger-wallet-topup", label: "Wallet Top-up" },
  { value: "operator-withdrawal-requested", label: "Withdrawal Requested" },
  { value: "operator-withdrawal-settled", label: "Withdrawal Settled" },
  { value: "operator-withdrawal-failed", label: "Withdrawal Failed" },
  { value: "operator-verification-approved", label: "Verification Approved" },
  { value: "operator-verification-rejected", label: "Verification Rejected" },
  // Operations
  { value: "passenger-trip-delayed", label: "Trip Delayed" },
  { value: "passenger-trip-cancelled", label: "Trip Cancelled" },
  { value: "passenger-trip-boarding", label: "Trip Boarding" },
  { value: "passenger-trip-gate-updated", label: "Gate Updated" },
  { value: "operator-bus-assigned", label: "Bus Assigned" },
  { value: "passenger-review-request", label: "Review Request" },
  // Passenger Lifecycle
  { value: "passenger-hold-created", label: "Hold Created" },
  { value: "passenger-wallet-low-balance", label: "Wallet Low Balance" },
  { value: "passenger-review-submitted", label: "Review Submitted" },
  { value: "passenger-profile-updated", label: "Profile Updated" },
  { value: "passenger-ticket-shared", label: "Ticket Shared" },
  // Platform Admin
  { value: "admin-treasury-network-failure", label: "Treasury Network Failure" },
  { value: "admin-operator-signup-pending", label: "Operator Signup Pending" },
  { value: "admin-bank-account-pending", label: "Bank Account Pending" },
  { value: "admin-payout-failed", label: "Payout Failed" },
  { value: "operator-bank-verified", label: "Bank Verified" },
  { value: "operator-bank-rejected", label: "Bank Rejected" },
  { value: "operator-account-suspended", label: "Account Suspended" },
  { value: "operator-account-restored", label: "Account Restored" },
  { value: "operator-withdrawal-resolved", label: "Withdrawal Resolved" },
  { value: "user-role-updated", label: "User Role Updated" },
];

export function AdminActivityLogsView() {
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [channel, setChannel] = useQueryState("channel", parseAsString.withDefault(""));
  const [template, setTemplate] = useQueryState("template", parseAsString.withDefault(""));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(0));

  const [searchInput, setSearchInput] = useState(search);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    const timeout = setTimeout(() => {
      setSearch(val || null);
      setPage(0);
    }, 350);
    return () => clearTimeout(timeout);
  };

  const hasFilters = !!search || !!channel || !!template;

  const clearFilters = () => {
    setSearch(null);
    setChannel(null);
    setTemplate(null);
    setPage(0);
    setSearchInput("");
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events..."
            className="pl-8"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <Select
          value={channel || "__all__"}
          onValueChange={(v) => {
            setChannel(v === "__all__" ? null : v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Channels</SelectItem>
            {CHANNELS.map((ch) => (
              <SelectItem key={ch.value} value={ch.value}>
                {ch.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={template || "__all__"}
          onValueChange={(v) => {
            setTemplate(v === "__all__" ? null : v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Workflows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Workflows</SelectItem>
            {TEMPLATE_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          }
        >
          <ActivityLogsTable />
        </Suspense>
      </Card>
    </div>
  );
}
