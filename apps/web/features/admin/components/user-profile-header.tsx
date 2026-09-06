"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { cn } from "@moja/ui/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  Shield,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserAvatar } from "@moja/ui/components/ui/user-avatar";

type UserRole = "TRAVELER" | "OPERATOR" | "ADMIN";

interface UserProfileHeaderProps {
  id: string;
  fullName: string;
  email: string;
  image?: string | null;
  phone?: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  backHref: string;
  backLabel: string;
  actions?: React.ReactNode;
}

const roleMeta: Record<UserRole, { label: string; className: string }> = {
  TRAVELER: {
    label: "Traveler",
    className: "bg-primary/10 text-primary",
  },
  OPERATOR: {
    label: "Operator",
    className: "bg-secondary text-secondary-foreground",
  },
  ADMIN: {
    label: "Admin",
    className: "bg-destructive/10 text-destructive",
  },
};


export function UserProfileHeader({
  id,
  fullName,
  email,
  image,
  phone,
  role,
  emailVerified,
  createdAt,
  backHref,
  backLabel,
  actions,
}: UserProfileHeaderProps) {
  const t = useTranslations("adminDashboard.userProfileHeader");
  const roleBadge = roleMeta[role];

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Top strip */}
      <div className="h-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />

      <div className="px-6 pb-6 -mt-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          {/* Avatar + name */}
          <div className="flex items-end gap-4">
            <UserAvatar
              name={fullName}
              src={image}
              seed={id || fullName}
              size="xl"
              className="h-20 w-20 rounded-xl border-4 border-card shadow-md shrink-0 text-2xl"
            />
            <div className="pb-1 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("border-0 text-xs", roleBadge.className)}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {roleBadge.label}
                </Badge>
                {emailVerified ? (
                  <Badge
                    variant="outline"
                    className="border-0 text-xs bg-success/10 text-success"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t("verified")}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-0 text-xs bg-warning/10 text-warning"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    {t("unverified")}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {t("memberSince", { date: format(createdAt, "MMMM yyyy") })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pb-1">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={backHref} />}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {backLabel}
            </Button>
            {actions}
          </div>
        </div>

        {/* Contact row */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            {email}
          </span>
          {phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              {phone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
