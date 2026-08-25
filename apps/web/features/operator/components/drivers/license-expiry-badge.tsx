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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <ShieldAlert className="size-3.5" />
        License expired{expiry ? ` ${expiry}` : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <AlertTriangle className="size-3.5" />
      Expires {expiry}
    </span>
  );
}
