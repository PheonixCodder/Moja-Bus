"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Briefcase, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

const EMPLOYMENT_OPTIONS = [
  {
    value: "EXCLUSIVE_INTERCITY",
    label: "Exclusive Intercity",
    hint: "Dedicated long-haul driver — single active operator",
  },
  {
    value: "CONTRACTOR_URBAN",
    label: "Contractor Urban",
    hint: "Urban loops — may drive for several operators",
  },
  {
    value: "HYBRID",
    label: "Hybrid",
    hint: "Mix of intercity and urban assignments",
  },
] as const;

interface SendOfferDialogProps {
  driverProfileId: string | null;
  driverName: string;
  /** Phase 3 (3.5) — driver's licence class for the licence-fit warning. */
  licenseCategory?: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendOfferDialog({
  driverProfileId,
  driverName,
  licenseCategory,
  open,
  onOpenChange,
}: SendOfferDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [employmentType, setEmploymentType] = useState<string>(
    "EXCLUSIVE_INTERCITY",
  );
  const [salary, setSalary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [note, setNote] = useState("");

  const sendMutation = useMutation({
    ...trpc.drivers.sendEmploymentOffer.mutationOptions(),
    onSuccess: () => {
      toast.success(`Offer sent to ${driverName}`, {
        description:
          "They'll receive a push notification and can accept, decline, or counter.",
      });
      queryClient.invalidateQueries(
        trpc.drivers.listMarketplaceDrivers.pathFilter(),
      );
      queryClient.invalidateQueries(trpc.drivers.listSentOffers.pathFilter());
      onOpenChange(false);
      setSalary("");
      setStartDate("");
      setNote("");
      setEmploymentType("EXCLUSIVE_INTERCITY");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send offer");
    },
  });

  const salaryNum = Number(salary.replace(/[^\d]/g, ""));
  const isValid =
    !!driverProfileId && Number.isFinite(salaryNum) && salaryNum >= 1000;

  const handleSubmit = () => {
    if (!driverProfileId || !isValid) return;
    sendMutation.mutate({
      driverProfileId,
      employmentType: employmentType as
        | "EXCLUSIVE_INTERCITY"
        | "CONTRACTOR_URBAN"
        | "HYBRID",
      proposedSalaryCFA: salaryNum,
      proposedStartDate: startDate || null,
      note: note.trim() || null,
    });
  };

  const selectedMeta = EMPLOYMENT_OPTIONS.find(
    (o) => o.value === employmentType,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="size-4 text-primary" />
            Send Employment Offer
          </DialogTitle>
          <DialogDescription>
            Formal offer for{" "}
            <span className="font-semibold text-slate-700">{driverName}</span>.
            They have 7 days to respond before it expires.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Employment Type */}
          <div className="space-y-1.5">
            <Label htmlFor="offer-type">Employment Model</Label>
            <Select
              value={employmentType}
              onValueChange={(value: string) =>
                setEmploymentType(value ?? "EXCLUSIVE_INTERCITY")
              }
            >
              <SelectTrigger id="offer-type">
                <SelectValue placeholder="Select employment model" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {selectedMeta?.hint}
            </p>
            {/* Phase 3 (3.5) — licence-fit warning: EXCLUSIVE_INTERCITY requires
                at least a D-class licence for intercity driving. Sub-D holders
                (B, C) may not legally operate intercity routes. */}
            {employmentType === "EXCLUSIVE_INTERCITY" &&
              licenseCategory &&
              ["B", "C"].includes(licenseCategory) && (
                <p className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                  <AlertTriangle className="size-3 shrink-0" />
                  Driver holds class {licenseCategory} — intercity requires D or
                  higher.
                </p>
              )}
          </div>

          {/* Monthly Salary */}
          <div className="space-y-1.5">
            <Label htmlFor="offer-salary">Monthly Salary (FCFA)</Label>
            <div className="relative">
              <Input
                id="offer-salary"
                type="number"
                min={1000}
                step={1000}
                placeholder="e.g. 250000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                FCFA
              </span>
            </div>
            {salaryNum >= 1000 && (
              <p className="text-[11px] text-emerald-600 font-medium">
                {salaryNum.toLocaleString("fr-FR")} FCFA per month
              </p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <Label htmlFor="offer-start">
              Proposed Start Date{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="offer-start"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="offer-note">
              Message to the driver{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="offer-note"
              rows={3}
              maxLength={2000}
              placeholder="Routes, schedule expectations, benefits…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sendMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Briefcase className="size-4" />
                Send Offer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
