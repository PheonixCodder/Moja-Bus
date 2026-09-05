"use client";

import { Button } from "@moja/ui/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import type { DriverDocType } from "@/features/driver/lib/driver-doc-access";
import { useTRPC } from "@/trpc/client";

/**
 * Phase-2 audit (driver-system-complete-audit/20) — THE one renderer for
 * private driver compliance documents on both approval surfaces.
 *
 * On-demand freshness: stored values are raw object keys; a short-lived
 * (5-min) URL is minted per view via drivers.presignDoc / admin.presignDoc,
 * so URLs can never expire mid-review and list queries stay presign-free.
 *
 * Legacy values pass through: pre-pipeline https links render directly;
 * device `file://` URIs show an honest re-upload placeholder.
 */

function isPdfValue(value: string): boolean {
  try {
    const pathname = value.startsWith("http") ? new URL(value).pathname : value;
    return pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

interface DriverDocPreviewProps {
  /** Which presign door to knock on — mirrors the two-domain router split. */
  audience: "operator" | "admin";
  driverProfileId: string;
  docType: DriverDocType;
  label: string;
  /** Raw stored value: object key (`documents/…`), legacy https URL, or null. */
  storedValue: string | null | undefined;
}

export function DriverDocPreview({
  audience,
  driverProfileId,
  docType,
  label,
  storedValue,
}: DriverDocPreviewProps) {
  const trpc = useTRPC();
  const [url, setUrl] = useState<string | null>(null);

  const operatorMint = useMutation(
    trpc.drivers.presignDoc.mutationOptions({
      onSuccess: (result) => setUrl(result.downloadUrl),
    }),
  );
  const adminMint = useMutation(
    trpc.admin.presignDoc.mutationOptions({
      onSuccess: (result) => setUrl(result.downloadUrl),
    }),
  );
  const mint = audience === "operator" ? operatorMint : adminMint;

  const isStoredKey = !!storedValue?.startsWith("documents/");

  // biome-ignore lint/correctness/useExhaustiveDependencies: mutation-hook identity changes every render — remint keys only on the document
  useEffect(() => {
    setUrl(null);
    if (!isStoredKey || !storedValue) return;
    mint.mutate({
      driverProfileId,
      docType,
      objectKey: storedValue,
    });
  }, [storedValue, driverProfileId]);

  const displayUrl = isStoredKey ? url : (storedValue ?? null);
  const isPdf = displayUrl ? isPdfValue(displayUrl) : false;

  return (
    <div className="border border-border rounded-xl p-3 bg-muted/30 space-y-2">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>

      <div className="h-44 rounded-lg bg-foreground/90 overflow-hidden flex items-center justify-center relative">
        {!storedValue ? (
          <span className="text-xs text-background/60 px-4 text-center">
            No document provided
          </span>
        ) : isStoredKey && !displayUrl ? (
          mint.isError ? (
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <span className="text-xs text-destructive">
                Could not load document
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  mint.mutate({
                    driverProfileId,
                    docType,
                    objectKey: storedValue,
                  })
                }
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="size-full animate-pulse bg-background/20" />
          )
        ) : !displayUrl ? null : isPdf ? (
          <object
            data={displayUrl}
            type="application/pdf"
            className="size-full"
          >
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <FileText className="size-8 text-background/60" />
              <span className="text-xs text-background/60">
                Inline PDF preview unavailable
              </span>
            </div>
          </object>
        ) : (
          /* biome-ignore lint/performance/noImgElement: presigned URLs are dynamic per-view; next/image remotePatterns stays first-party-only by policy (Phase 35) */
          <img
            src={displayUrl}
            alt={label}
            className="size-full object-contain"
          />
        )}
      </div>

      {!storedValue || storedValue.startsWith("file://") ? (
        storedValue?.startsWith("file://") ? (
          <p className="text-[11px] text-warning leading-snug">
            Legacy device URI — ask the driver to re-upload
          </p>
        ) : null
      ) : (
        <Button
          type="button"
          variant="ghost"
          disabled={!displayUrl}
          onClick={() => {
            if (displayUrl) window.open(displayUrl, "_blank", "noreferrer");
          }}
          className="h-auto p-0 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline hover:bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ExternalLink className="size-3" />
          Open full document
        </Button>
      )}
    </div>
  );
}
