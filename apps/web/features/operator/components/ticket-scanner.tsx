"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { cn } from "@moja/ui/lib/utils";

const SCAN_DEBOUNCE_MS = 2000;
const SCANNER_CONTAINER_ID = "ticket-scanner-view";

export interface TicketScanResult {
  passengerName: string;
  seatLabel: string;
  bookingReference: string;
  alreadyCheckedIn: boolean;
}

interface TicketScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (rawValue: string) => Promise<TicketScanResult>;
  title?: string;
  description?: string;
  disabled?: boolean;
}

export function TicketScanner({
  open,
  onOpenChange,
  onScan,
  title = "Scan ticket",
  description = "Point the camera at the passenger QR code on their ticket.",
  disabled = false,
}: TicketScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const [starting, setStarting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<TicketScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // ignore cleanup errors
    }
  }, []);

  const handleDecoded = useCallback(async (raw: string) => {
    if (disabled) return;

    const now = Date.now();
    const last = lastScanRef.current;
    if (last && last.value === raw && now - last.at < SCAN_DEBOUNCE_MS) {
      return;
    }
    lastScanRef.current = { value: raw, at: now };

    setProcessing(true);
    setError(null);
    try {
      const result = await onScanRef.current(raw);
      setLastResult(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Check-in failed.";
      setError(message);
      setLastResult(null);
    } finally {
      setProcessing(false);
    }
  }, [disabled]);

  useLayoutEffect(() => {
    if (!open) {
      void stopScanner();
      setStarting(false);
      setProcessing(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let rafId = 0;
    setStarting(true);
    setLastResult(null);
    setError(null);

    const startScanner = () => {
      const element = containerRef.current;
      if (!element) {
        rafId = requestAnimationFrame(startScanner);
        return;
      }

      const scanner = new Html5Qrcode(SCANNER_CONTAINER_ID);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (!cancelled) {
              void handleDecoded(decoded);
            }
          },
          () => {
            // scan failure per frame — ignore
          },
        )
        .then(() => {
          if (!cancelled) setStarting(false);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setStarting(false);
            setError(
              err instanceof Error
                ? err.message
                : "Could not access camera. Check permissions.",
            );
          }
        });
    };

    rafId = requestAnimationFrame(startScanner);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      void stopScanner();
    };
  }, [open, handleDecoded, stopScanner]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="size-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border border-border bg-black/5",
              "min-h-[280px] flex items-center justify-center",
            )}
          >
            {(starting || processing) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
                <Spinner className="size-8 text-primary" />
              </div>
            )}
            <div
              ref={containerRef}
              id={SCANNER_CONTAINER_ID}
              className="w-full"
            />
          </div>

          {disabled ? (
            <p className="text-sm text-muted-foreground">
              Loading trip details…
            </p>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive font-medium">{error}</p>
          ) : null}

          {lastResult ? (
            <div
              className={cn(
                "rounded-md border p-3 text-sm",
                lastResult.alreadyCheckedIn
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900",
              )}
            >
              <p className="font-bold">
                {lastResult.alreadyCheckedIn
                  ? "Already checked in"
                  : "Checked in successfully"}
              </p>
              <p className="mt-1">
                {lastResult.passengerName} · Seat {lastResult.seatLabel}
              </p>
              <p className="text-xs opacity-80 mt-0.5">
                Ref {lastResult.bookingReference}
              </p>
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
