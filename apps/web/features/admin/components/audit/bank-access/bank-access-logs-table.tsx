"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { format } from "date-fns";
import { useTRPC } from "@/trpc/client";
import { bankAccessLogSearchParams } from "../../../lib/search-params";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { Badge } from "@moja/ui/components/ui/badge";
import { BankAccessLogsPagination } from "./bank-access-logs-pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@moja/ui/components/ui/avatar";

export function BankAccessLogsTable() {
  const [params] = useQueryStates(bankAccessLogSearchParams);
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.admin.listBankAccessLogs.queryOptions({
      page: params.page,
      limit: 20,
      action: params.action || undefined,
      companyId: params.companyId || undefined,
      userId: params.userId || undefined,
    })
  );

  const items = data.items;
  const totalCount = data.total;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium">No records found</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          No bank access logs match your current filters. Adjust your filters or clear them to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[180px] pl-4">Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target Company</TableHead>
              <TableHead>User / Actor</TableHead>
              <TableHead className="pr-4 text-right">IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((log: any) => (
              <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="pl-4 text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={log.action === "VIEW_FULL" ? "destructive" : "secondary"}
                    className={`text-[10px] uppercase font-mono px-1.5 py-0 ${
                      log.action === "CREATE" || log.action === "UPDATE" 
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                        : ""
                    }`}
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                      {log.company.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">
                      {log.company.id}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">
                        {log.user.fullName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {log.user.fullName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                        {log.user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="pr-4 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {log.ip || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <BankAccessLogsPagination totalCount={totalCount} limit={20} />
    </div>
  );
}
