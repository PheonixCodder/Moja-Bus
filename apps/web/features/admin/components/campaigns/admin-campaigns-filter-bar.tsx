"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Plus, Search } from "lucide-react";

interface AdminCampaignsFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  onOpenCreate: () => void;
}

export function AdminCampaignsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onOpenCreate,
}: AdminCampaignsFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search campaigns..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select value={status} onValueChange={(val) => onStatusChange(val ?? status)}>
          <SelectTrigger className="w-[150px] bg-white">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="EXHAUSTED">Exhausted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        onClick={onOpenCreate}
        className="gap-2 shadow-xs bg-slate-900 hover:bg-slate-800 text-white font-medium"
      >
        <Plus className="size-4" />
        New campaign
      </Button>
    </div>
  );
}
