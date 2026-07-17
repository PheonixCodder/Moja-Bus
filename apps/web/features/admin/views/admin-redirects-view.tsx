"use client";

import { useState, Suspense } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { Input } from "@moja/ui/components/ui/input";
import { Button } from "@moja/ui/components/ui/button";
import { Plus, Search } from "lucide-react";
import { RedirectsTable } from "../components/content/redirects-table";
import { RedirectFormDialog } from "../components/content/redirect-form-dialog";
import { Card } from "@moja/ui/components/ui/card";

export function AdminRedirectsView() {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [searchInputValue, setSearchInputValue] = useState(q);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Debounce search update
  const handleSearchChange = (val: string) => {
    setSearchInputValue(val);
    const timeout = setTimeout(() => {
      setQ(val || null);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timeout);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search source or destination..."
            className="pl-8"
            value={searchInputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Redirect
        </Button>
      </div>

      {/* Main Table Area */}
      <Card className="overflow-hidden">
        <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading redirects...</div>}>
          <RedirectsTable />
        </Suspense>
      </Card>

      {/* Create Dialog */}
      <RedirectFormDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />
    </div>
  );
}
