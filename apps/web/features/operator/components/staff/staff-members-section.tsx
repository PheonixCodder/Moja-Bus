"use client";

import { Users, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { StaffMemberRow } from "@/features/operator/components/staff/staff-member-row";
import type {
  OperatorStatus,
  StaffMember,
  StaffRole,
} from "@/features/operator/lib/staff";

const PAGE_SIZE = 50;

interface StaffMembersSectionProps {
  members: StaffMember[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  hasActiveFilters: boolean;
  canInvite: boolean;
  canUpdate: boolean;
  callerRole: StaffRole;
  onRetry: () => void;
  onInvite: () => void;
  onPageChange: (page: number) => void;
  onEditRole: (member: StaffMember) => void;
  onEditPermissions: (member: StaffMember) => void;
  onStatusChange: (member: StaffMember, status: OperatorStatus) => void;
  onTransfer: (member: StaffMember) => void;
  onRemove: (member: StaffMember) => void;
}

export function StaffMembersSection({
  members,
  total,
  page,
  totalPages,
  isLoading,
  isFetching,
  isError,
  hasActiveFilters,
  canInvite,
  canUpdate,
  callerRole,
  onRetry,
  onInvite,
  onPageChange,
  onEditRole,
  onEditPermissions,
  onStatusChange,
  onTransfer,
  onRemove,
}: StaffMembersSectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
        <span>
          Team Members · {total}
          {isFetching ? (
            <span className="ml-2 text-muted-foreground/50">(loading…)</span>
          ) : null}
        </span>
      </h2>

      {isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50 py-16 text-center">
          <p className="text-[14px] font-medium text-red-600">
            Failed to load staff
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 text-xs"
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      ) : members.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center shadow-sm">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
          {hasActiveFilters ? (
            <>
              <p className="text-[14px] font-medium text-foreground">
                No results found
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-medium text-foreground">
                No team members yet
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Invite your first employee to get started.
              </p>
              {canInvite ? (
                <Button
                  size="sm"
                  className="mt-4 h-8.5 gap-1.5 bg-[#ee237c] hover:bg-[#d11f6e] text-white text-xs font-semibold"
                  onClick={onInvite}
                >
                  <UserPlus className="size-4" />
                  Invite Member
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <>
          <div
            className={cn(
              "rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-opacity",
              isFetching && "opacity-60",
            )}
          >
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5",
                      i !== 4 && "border-b border-border",
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                      <div className="h-2.5 w-48 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                ))
              : members.map((member, idx) => (
                  <StaffMemberRow
                    key={member.id}
                    member={member}
                    isLast={idx === members.length - 1}
                    callerRole={callerRole}
                    canUpdate={canUpdate}
                    onEditRole={onEditRole}
                    onEditPermissions={onEditPermissions}
                    onStatusChange={onStatusChange}
                    onTransfer={onTransfer}
                    onRemove={onRemove}
                  />
                ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between px-1">
              <p className="text-[12px] text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, total)}
                </span>{" "}
                of <span className="font-medium text-foreground">{total}</span>{" "}
                members
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1"
                  disabled={page <= 1 || isFetching}
                  onClick={() => onPageChange(page - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="text-[12px] text-muted-foreground font-medium px-1">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => onPageChange(page + 1)}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
