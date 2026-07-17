"use client";

import { useQueryState } from "nuqs";
import { Search } from "lucide-react";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Card, CardContent } from "@moja/ui/components/ui/card";
import { useTransition } from "react";

export function AdminRoutesHeader() {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useQueryState("q", { defaultValue: "", shallow: false });
  const [status, setStatus] = useQueryState("status", { defaultValue: "All", shallow: false });

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by route, terminal, or operator name..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => {
              startTransition(() => {
                setSearch(e.target.value || null);
              });
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={status}
            onValueChange={(val) => {
              startTransition(() => {
                setStatus(val === "All" ? null : val);
              });
            }}
          >
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
