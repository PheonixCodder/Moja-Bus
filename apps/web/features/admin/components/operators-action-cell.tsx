"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import type { OperatorRow } from "./operators-columns";

export function OperatorActionCell({ operator }: { operator: OperatorRow }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const demoteMutation = useMutation({
    ...trpc.admin.updateUserRole.mutationOptions(),
    onSuccess: () => {
      toast.success("Operator demoted to Traveler.");
      queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role");
    },
  });

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-muted-foreground hover:bg-muted focus:outline-none">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <p className="px-2 py-1 text-xs font-normal text-muted-foreground">Actions</p>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/users/operators/${operator.id}`)}>
            View Profile
          </DropdownMenuItem>
          {operator.companies.length > 0 && (
            <DropdownMenuItem>Manage Company</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => demoteMutation.mutate({ userId: operator.id, role: "TRAVELER" })}
            className="text-amber-600 focus:text-amber-600"
          >
            <ShieldOff className="mr-2 h-4 w-4" />
            Demote to Traveler
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
