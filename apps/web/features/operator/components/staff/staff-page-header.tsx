"use client";

import { Users, UserPlus } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";

interface StaffPageHeaderProps {
  canInvite: boolean;
  onInvite: () => void;
}

export function StaffPageHeader({ canInvite, onInvite }: StaffPageHeaderProps) {
  return (
    <div className="border-b border-border bg-card px-6 py-5 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5.5 text-primary" />
            Staff
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your team, roles, and invitations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canInvite ? (
            <Button
              size="sm"
              className="h-8.5 text-xs font-semibold bg-[#ee237c] hover:bg-[#d11f6e] text-white"
              onClick={onInvite}
            >
              <UserPlus className="size-4 mr-1.5" />
              Invite Member
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
