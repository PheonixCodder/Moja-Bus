"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Mail, Phone, Shield } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { cn } from "@moja/ui/lib/utils";

type UserRole = "TRAVELER" | "OPERATOR" | "ADMIN";

interface UserProfileHeaderProps {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  backHref: string;
  backLabel: string;
  actions?: React.ReactNode;
}

const roleMeta: Record<UserRole, { label: string; className: string }> = {
  TRAVELER: { label: "Traveler", className: "bg-blue-100/60 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  OPERATOR: { label: "Operator", className: "bg-violet-100/60 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  ADMIN: { label: "Admin", className: "bg-rose-100/60 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarTone(name: string) {
  const tones = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return tones[Math.abs(hash) % tones.length]!;
}

export function UserProfileHeader({
  fullName,
  email,
  phone,
  role,
  emailVerified,
  createdAt,
  backHref,
  backLabel,
  actions,
}: UserProfileHeaderProps) {
  const initials = getInitials(fullName);
  const toneClass = getAvatarTone(fullName);
  const roleBadge = roleMeta[role];

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Top strip */}
      <div className="h-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />

      <div className="px-6 pb-6 -mt-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          {/* Avatar + name */}
          <div className="flex items-end gap-4">
            <div
              className={cn(
                "h-20 w-20 rounded-xl flex items-center justify-center text-2xl font-bold border-4 border-card shadow-md shrink-0",
                toneClass
              )}
            >
              {initials}
            </div>
            <div className="pb-1 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("border-0 text-xs", roleBadge.className)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {roleBadge.label}
                </Badge>
                {emailVerified ? (
                  <Badge variant="outline" className="border-0 text-xs bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-0 text-xs bg-amber-100/60 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <XCircle className="h-3 w-3 mr-1" />
                    Unverified
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Member since {format(createdAt, "MMMM yyyy")}
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
