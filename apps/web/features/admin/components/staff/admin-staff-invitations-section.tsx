"use client";

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminStaffInvitationCard } from "@/features/admin/components/staff/admin-staff-invitation-card";
import type { AdminStaffInvitation } from "@/features/admin/lib/admin-staff";

interface AdminStaffInvitationsSectionProps {
  invitations: Array<AdminStaffInvitation & { createdAt?: Date | string }>;
  onResend: (invitation: AdminStaffInvitation) => void;
  onCancel: (invitation: AdminStaffInvitation) => void;
  canDelete: boolean;
}

export function AdminStaffInvitationsSection({
  invitations,
  onResend,
  onCancel,
  canDelete,
}: AdminStaffInvitationsSectionProps) {
  const t = useTranslations("adminDashboard.staff.invitationsSection");
  return (
    <section>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {t("title", { count: invitations.length })}
      </h2>

      {invitations.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card py-8 text-center shadow-sm">
          <div>
            <Mail className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">{t("empty")}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {invitations.map((invitation) => (
            <AdminStaffInvitationCard
              key={invitation.id}
              invitation={invitation}
              onResend={onResend}
              onCancel={onCancel}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
