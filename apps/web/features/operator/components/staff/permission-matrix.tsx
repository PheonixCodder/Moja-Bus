"use client";

import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { Label } from "@moja/ui/components/ui/label";
import { Input } from "@moja/ui/components/ui/input";
import { useMemo, useState } from "react";
import {
  getPermissionsByGroup,
  type PermissionKey,
} from "@/features/operator/lib/staff";

interface PermissionMatrixProps {
  selected: PermissionKey[];
  onChange: (next: PermissionKey[]) => void;
  /** Only these keys are selectable (grant ⊆ own). Empty = all catalog keys. */
  grantable?: PermissionKey[];
  disabled?: boolean;
}

export function PermissionMatrix({
  selected,
  onChange,
  grantable,
  disabled,
}: PermissionMatrixProps) {
  const [filter, setFilter] = useState("");
  const groups = useMemo(() => getPermissionsByGroup(), []);
  const grantableSet = useMemo(
    () => (grantable ? new Set(grantable) : null),
    [grantable],
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(key: PermissionKey, checked: boolean) {
    if (disabled) return;
    if (grantableSet && !grantableSet.has(key)) return;
    if (checked) {
      onChange([...selected, key]);
    } else {
      onChange(selected.filter((k) => k !== key));
    }
  }

  function toggleGroup(keys: PermissionKey[], allSelected: boolean) {
    if (disabled) return;
    const allowed = grantableSet
      ? keys.filter((k) => grantableSet.has(k))
      : keys;
    if (allSelected) {
      onChange(selected.filter((k) => !allowed.includes(k)));
    } else {
      const next = new Set(selected);
      for (const k of allowed) next.add(k);
      onChange([...next]);
    }
  }

  const q = filter.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter permissions..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="h-9"
      />
      <div className="max-h-[420px] space-y-5 overflow-y-auto pr-1">
        {Object.entries(groups).map(([group, items]) => {
          const visible = items.filter((item) => {
            if (grantableSet && !grantableSet.has(item.key)) return false;
            if (!q) return true;
            return (
              item.label.toLowerCase().includes(q) ||
              item.key.toLowerCase().includes(q) ||
              group.toLowerCase().includes(q)
            );
          });
          if (visible.length === 0) return null;
          const keys = visible.map((i) => i.key);
          const allSelected = keys.every((k) => selectedSet.has(k));
          const someSelected = keys.some((k) => selectedSet.has(k));

          return (
            <div key={group} className="space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-1.5">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  onClick={() => toggleGroup(keys, allSelected)}
                  disabled={disabled}
                >
                  {group}
                </button>
                <span className="text-[11px] text-muted-foreground">
                  {someSelected
                    ? `${keys.filter((k) => selectedSet.has(k)).length}/${keys.length}`
                    : `${keys.length}`}
                </span>
              </div>
              <div className="space-y-2">
                {visible.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-start gap-2.5 rounded-md px-1 py-1 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedSet.has(item.key)}
                      onCheckedChange={(v) => toggle(item.key, v === true)}
                      disabled={disabled}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <Label className="cursor-pointer text-sm font-medium leading-none">
                        {item.label}
                      </Label>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {item.key}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
