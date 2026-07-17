"use client";

import { useQueryStates } from "nuqs";
import { webhookLogsSearchParams } from "../../../lib/search-params";
import { Input } from "@moja/ui/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";

export function WebhookLogsFilters() {
  const [params, setParams] = useQueryStates(webhookLogsSearchParams);

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search reference or idempotency key..."
          className="w-full bg-background pl-8"
          value={params.search}
          onChange={(e) => setParams({ search: e.target.value || "", page: 1 })}
        />
      </div>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
        <Select
          value={params.provider}
          onValueChange={(val) => setParams({ provider: val, page: 1 })}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Providers</SelectItem>
            <SelectItem value="Paystack">Paystack</SelectItem>
            <SelectItem value="Stripe">Stripe</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.status}
          onValueChange={(val) => setParams({ status: val, page: 1 })}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Processed">Processed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
