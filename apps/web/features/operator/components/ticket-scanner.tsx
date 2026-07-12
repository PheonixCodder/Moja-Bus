"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, Search } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
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
  description = "Point the camera at the passenger QR code on their ticket or enter details manually.",
  disabled = false,
}: TicketScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const [starting, setStarting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const [lastResult, setLastResult] = useState<TicketScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [manualInput, setManualInput] = useState("");

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
    if (disabled || processingRef.current) return;

    const now = Date.now();
    const last = lastScanRef.current;
    if (last && last.value === raw && now - last.at < SCAN_DEBOUNCE_MS) {
      return;
    }
    lastScanRef.current = { value: raw, at: now };

    setProcessing(true);
    processingRef.current = true;
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
      processingRef.current = false;
    }
  }, [disabled]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim() || disabled || processingRef.current) return;

    setProcessing(true);
    processingRef.current = true;
    setError(null);
    try {
      const result = await onScanRef.current(manualInput.trim());
      setLastResult(result);
      setManualInput(""); // Clear manual input on success
    } catch (err) {
      const message = err instanceof Error ? err.message : "Check-in failed.";
      setError(message);
      setLastResult(null);
    } finally {
      setProcessing(false);
      processingRef.current = false;
    }
  };

  useLayoutEffect(() => {
    if (!open || mode === "manual") {
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
  }, [open, mode, handleDecoded, stopScanner]);

  // Clean state when modal visibility toggles
  useEffect(() => {
    if (open) {
      setMode("scan");
      setManualInput("");
      setLastResult(null);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-border rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text-primary">
            <ScanLine className="size-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-text-muted">{description}</DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 rounded-lg bg-slate-100 border border-slate-200/80 w-fit mb-1">
          <button
            type="button"
            onClick={() => setMode("scan")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200",
              mode === "scan"
                ? "bg-white text-primary border border-slate-200/40 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Camera Scan
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200",
              mode === "manual"
                ? "bg-white text-primary border border-slate-200/40 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Enter Manually
          </button>
        </div>

        <div className="space-y-4">
          {mode === "manual" ? (
            <form onSubmit={handleManualSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="manual-token" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Ticket Token or Reference Number
                </Label>
                <div className="relative">
                  <Input
                    id="manual-token"
                    placeholder="Enter code (e.g. MOB-ABCD1)"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    disabled={processing}
                    className="pr-10 h-10 border-slate-200 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={processing || !manualInput.trim()}
                className="w-full bg-primary hover:bg-primary/95 text-white h-10 text-xs font-bold rounded-lg shadow-xs"
              >
                {processing ? "Checking in..." : "Confirm Boarding"}
              </Button>
            </form>
          ) : (
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
          )}

          {disabled ? (
            <p className="text-xs text-muted-foreground">
              Loading trip details…
            </p>
          ) : null}

          {error ? (
            <p className="text-xs text-destructive font-medium bg-red-50 border border-red-100 p-2.5 rounded-lg">{error}</p>
          ) : null}

          {lastResult ? (
            <div
              className={cn(
                "rounded-lg border p-3 text-sm",
                lastResult.alreadyCheckedIn
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900",
              )}
            >
              <p className="font-bold text-xs">
                {lastResult.alreadyCheckedIn
                  ? "Already checked in"
                  : "Checked in successfully"}
              </p>
              <p className="mt-1 text-xs">
                {lastResult.passengerName} · Seat {lastResult.seatLabel}
              </p>
              <p className="text-[10px] opacity-80 mt-0.5">
                Ref {lastResult.bookingReference}
              </p>
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="w-full h-10 text-xs border-slate-200"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
