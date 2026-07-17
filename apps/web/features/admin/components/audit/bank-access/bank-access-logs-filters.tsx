"use client";

import { useQueryStates } from "nuqs";
import { bankAccessLogSearchParams } from "../../../lib/search-params";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Button } from "@moja/ui/components/ui/button";
import { X } from "lucide-react";
import { Input } from "@moja/ui/components/ui/input";

export function BankAccessLogsFilters() {
  const [{ action, companyId, userId }, setFilters] = useQueryStates(
    bankAccessLogSearchParams
  );

  const hasFilters = Boolean(action || companyId || userId);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={action || "__all__"}
        onValueChange={(v) => {
          setFilters({ action: v === "__all__" ? null : v, page: 0 });
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Actions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Actions</SelectItem>
          <SelectItem value="VIEW_FULL">Decryption (VIEW_FULL)</SelectItem>
          <SelectItem value="CREATE">Creation (CREATE)</SelectItem>
          <SelectItem value="UPDATE">Modification (UPDATE)</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="Filter by Company ID..."
        value={companyId || ""}
        onChange={(e) =>
          setFilters({ companyId: e.target.value || null, page: 0 })
        }
        className="w-[200px]"
      />
      
      <Input
        placeholder="Filter by User ID..."
        value={userId || ""}
        onChange={(e) =>
          setFilters({ userId: e.target.value || null, page: 0 })
        }
        className="w-[200px]"
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({ action: null, companyId: null, userId: null, page: 0 })
          }
          className="h-9 px-2.5 text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}
