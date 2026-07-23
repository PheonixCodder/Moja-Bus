"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@moja/ui/components/ui/button";

interface AccessDeniedCardProps {
  permission?: string;
  title?: string;
  description?: string;
}

export function AccessDeniedCard({
  permission,
  title = "Access Restricted",
  description = "You do not have the required staff permissions to view or manage this operational module.",
}: AccessDeniedCardProps) {
  return (
    <div className="container max-w-4xl py-16 px-4 flex flex-col items-center justify-center text-center space-y-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {permission && (
          <p className="text-xs font-mono text-muted-foreground/70 pt-2">
            Required Permission: <span className="text-destructive font-semibold">{permission}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" render={<Link href="/dashboard/operator" />}>
          Return to Overview
        </Button>
      </div>
    </div>
  );
}
