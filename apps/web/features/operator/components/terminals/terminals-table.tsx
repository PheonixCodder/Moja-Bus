"use client";

import { useState } from "react";
import { Building, MapPin, Pencil, Trash2, SwitchCamera, CheckCircle, Navigation } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Switch } from "@moja/ui/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";

interface TerminalsTableProps {
  locations: any[];
  onEdit: (loc: any) => void;
  onToggleTerminal: (loc: any, currentVal: boolean) => void;
  onDelete: (loc: any) => void;
  togglingId?: string | null;
}

export function TerminalsTable({
  locations,
  onEdit,
  onToggleTerminal,
  onDelete,
  togglingId,
}: TerminalsTableProps) {
  if (!locations || locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-card/50">
        <Building className="size-10 text-muted-foreground/50 mb-3" />
        <h3 className="text-base font-semibold text-foreground">No locations found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Create your first passenger terminal or depot location to start configuring transit routes.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-sm border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3">Location Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">City & Address</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {locations.map((loc) => (
            <tr key={loc.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3.5 font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                    {loc.isTerminal ? <MapPin className="size-3.5" /> : <Building className="size-3.5" />}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{loc.name}</span>
                    {loc.isPrimary && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                        Primary Hub
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={loc.isTerminal}
                    disabled={togglingId === loc.id}
                    onCheckedChange={() => onToggleTerminal(loc, loc.isTerminal)}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {loc.isTerminal ? "Passenger Terminal" : "Depot / Operations"}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-xs text-muted-foreground">
                <div>{loc.cityRelation?.name ?? loc.city ?? "Unassigned"}</div>
                <div className="text-[11px] text-muted-foreground/70 truncate max-w-[200px]">
                  {loc.addressLine1}
                </div>
              </td>
              <td className="px-4 py-3.5 text-xs font-mono text-foreground">
                {loc.phone || "—"}
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    loc.isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {loc.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3.5 text-right space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onEdit(loc)}
                  title="Edit Location"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(loc)}
                  title="Delete Location"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
