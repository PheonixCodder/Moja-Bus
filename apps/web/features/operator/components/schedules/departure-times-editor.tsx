"use client";

import { useMemo, useState } from "react";
import { Plus, X, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@moja/ui/components/ui/button";
import { Label } from "@moja/ui/components/ui/label";
import { TimePicker } from "@moja/ui/components/ui/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { toast } from "sonner";

const CADENCE_FREQUENCIES = [15, 30, 45, 60, 90] as const;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return parseInt(h ?? "0", 10) * 60 + parseInt(m ?? "0", 10);
}

function toHhMm(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Sorted, deduplicated HH:mm list. */
function normalizeTimes(times: string[]): string[] {
  const seen = new Set<string>();
  return times
    .filter((t) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(t))
    .sort((a, b) => toMinutes(a) - toMinutes(b))
    .filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
}

/**
 * Cadence-aware departure time editor: manual add/remove plus quick presets
 * that generate the full list at a fixed frequency between a start and end
 * time (e.g. every 30 min from 06:00 to 22:00).
 */

/**
 * Pure helper: attempt to add `draft` to `current` (an already-normalized
 * list). Returns the new sorted/deduplicated list plus an `added` flag so the
 * caller can surface feedback when the time is a duplicate or invalid.
 */
export function addDepartureTime(
  current: string[],
  draft: string,
): { times: string[]; added: boolean } {
  const withDraft = normalizeTimes([...current, draft]);
  const base = normalizeTimes(current);
  return {
    times: withDraft,
    added: withDraft.length !== base.length,
  };
}

export function DepartureTimesEditor({
  times,
  onChange,
}: {
  times: string[];
  onChange: (times: string[]) => void;
}) {
  const t = useTranslations("operatorDashboard.schedules");
  const [draft, setDraft] = useState("07:00");
  const [cadStart, setCadStart] = useState("06:00");
  const [cadFrequency, setCadFrequency] = useState(30);
  const [cadEnd, setCadEnd] = useState("22:00");

  const normalized = useMemo(() => normalizeTimes(times), [times]);

  function addDraft() {
    const { times, added } = addDepartureTime(normalized, draft);
    if (!added) {
      toast.error(t("wizard.duplicateTime", { time: draft }));
      return;
    }
    onChange(times);
    setDraft("");
  }

  function removeTime(hhmm: string) {
    onChange(normalized.filter((x) => x !== hhmm));
  }

  function applyCadence() {
    const start = Math.min(toMinutes(cadStart), toMinutes(cadEnd));
    const end = Math.max(toMinutes(cadStart), toMinutes(cadEnd));
    const freq = Math.max(1, cadFrequency);

    const generated: string[] = [];
    for (let m = start; m <= end; m += freq) {
      generated.push(toHhMm(m));
    }
    if (generated.length === 0) generated.push(toHhMm(start));
    // Always include the end time even if it doesn't land on the step.
    const last = generated[generated.length - 1]!;
    if (toMinutes(last) < end) generated.push(toHhMm(end));

    onChange(normalizeTimes([...normalized, ...generated]));
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold">
        {t("wizard.departureTimes")}
      </Label>

      {normalized.length === 0 ? (
        <p className="text-xs text-destructive">
          {t("wizard.noDepartureTimes")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {normalized.map((hhmm) => (
            <span
              key={hhmm}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-mono font-semibold"
            >
              {hhmm}
              <button
                type="button"
                aria-label={t("wizard.removeTime", { time: hhmm })}
                onClick={() => removeTime(hhmm)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="w-32">
          <Label className="text-[11px] text-muted-foreground">
            {t("wizard.addTime")}
          </Label>
          <TimePicker
            value={draft}
            onChange={(v) => setDraft(v)}
            className="h-9 text-xs w-full"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9"
          onClick={addDraft}
          disabled={!draft}
        >
          <Plus className="size-3.5 mr-1" />
          {t("wizard.add")}
        </Button>
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
        <p className="text-[11px] font-bold text-primary flex items-center gap-1">
          <Zap className="size-3" />
          {t("wizard.cadencePreset")}
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-28">
            <Label className="text-[11px] text-muted-foreground">
              {t("wizard.cadenceStart")}
            </Label>
            <TimePicker
              value={cadStart}
              onChange={(v) => setCadStart(v)}
              className="h-9 text-xs w-full"
            />
          </div>
          <div className="w-28">
            <Label className="text-[11px] text-muted-foreground">
              {t("wizard.cadenceEvery")}
            </Label>
            <Select
              value={String(cadFrequency)}
              onValueChange={(v) => setCadFrequency(parseInt(v ?? "30", 10))}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CADENCE_FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={String(f)}>
                    {t("wizard.cadenceMinutes", { count: f })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28">
            <Label className="text-[11px] text-muted-foreground">
              {t("wizard.cadenceEnd")}
            </Label>
            <TimePicker
              value={cadEnd}
              onChange={(v) => setCadEnd(v)}
              className="h-9 text-xs w-full"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9"
            onClick={applyCadence}
          >
            {t("wizard.applyCadence")}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("wizard.cadenceDesc")}
        </p>
      </div>
    </div>
  );
}
