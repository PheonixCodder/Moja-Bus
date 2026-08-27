"use client";

import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { StaffInvitationCard } from "@/features/operator/components/staff/staff-invitation-card";
import type { StaffInvitation } from "@/features/operator/lib/staff";

interface StaffInvitationsSectionProps {
  invitations: Array<StaffInvitation & { createdAt?: Date | string }>;
  onResend: (invitation: StaffInvitation) => void;
  onCancel: (invitation: StaffInvitation) => void;
  canDelete: boolean;
}

export function StaffInvitationsSection({
  invitations,
  onResend,
  onCancel,
  canDelete,
}: StaffInvitationsSectionProps) {
  const t = useTranslations("operatorDashboard.staff.invitationsSection");
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
            <StaffInvitationCard
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
