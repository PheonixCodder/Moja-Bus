"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@moja/ui/components/ui/empty";
import type { RouteListItem } from "@/features/operator/lib/schedules/types";

export function RoutePickerStep({
  routes,
  selectedId,
  onSelect,
  name,
  onNameChange,
}: {
  routes: RouteListItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  name: string;
  onNameChange: (val: string) => void;
}) {
  const activeRoutes = routes.filter((r) => r.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="schedule-name" className="text-sm font-bold text-foreground">
          Schedule Name (optional)
        </Label>
        <Input
          id="schedule-name"
          placeholder="e.g. Morning Express"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground">Select a route</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Only active routes can be scheduled.
        </p>
      </div>

      {activeRoutes.length === 0 ? (
        <Empty className="py-10">
          <EmptyMedia>
            <ArrowRight className="size-8 text-muted-foreground/30" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No active routes available</EmptyTitle>
            <EmptyDescription>
              Activate a route first before scheduling it.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/dashboard/operator/routes">
              <Button size="sm" variant="outline">
                Go to Routes →
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeRoutes.map((r) => {
            const isSelected = r.id === selectedId;
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => onSelect(r.id)}
                className={cn(
                  "text-left p-4 rounded-md border transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{r.name}</p>
                  {isSelected && (
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {r.originTerminal?.cityRelation?.name ??
                      r.originTerminal?.city}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground">
                    {r.destTerminal?.cityRelation?.name ?? r.destTerminal?.city}
                  </span>
                </div>
                {r.estimatedMinutes ? (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="size-3" />~
                    {Math.floor(r.estimatedMinutes / 60)}h{" "}
                    {r.estimatedMinutes % 60}m
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
