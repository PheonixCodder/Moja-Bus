"use client";

import { licenseExpiryStatus } from "@moja/schemas";
import { AlertTriangle, ShieldAlert } from "lucide-react";

/**
 * Phase 14 (F-OP-03) — licence expiry state on roster rows + passports.
 * Yellow ≤30 days ("expires soon"), red past expiry. Renders nothing while
 * the licence is valid or unknown.
 */
export function LicenseExpiryBadge({
  licenseExpiryDate,
}: {
  licenseExpiryDate: string | Date | null | undefined;
}) {
  const status = licenseExpiryStatus(licenseExpiryDate);
  if (status === "VALID") return null;

  const expiry = licenseExpiryDate
    ? new Date(licenseExpiryDate).toISOString().slice(0, 10)
    : "";

  if (status === "EXPIRED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
        <ShieldAlert className="size-3.5" />
        License expired{expiry ? ` ${expiry}` : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
      <AlertTriangle className="size-3.5" />
      Expires {expiry}
    </span>
  );
}
