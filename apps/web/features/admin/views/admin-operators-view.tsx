"use client";

import { Operators } from "../components/operators";
import { Plus } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";

export function AdminOperatorsView() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Operators Directory</h2>
          <p className="text-muted-foreground">Manage transportation operator accounts and their system access.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Operator
          </Button>
        </div>
      </div>
      <Operators />
    </div>
  );
}
