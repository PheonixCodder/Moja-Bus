"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import type { TravelerRow } from "./travelers-columns";

export function TravelerActionCell({ row }: { row: TravelerRow }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const updateRoleMutation = useMutation({
    ...trpc.admin.updateUserRole.mutationOptions(),
    onSuccess: () => {
      toast.success("User promoted to operator successfully.");
      queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role");
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-md p-0 text-muted-foreground hover:bg-muted/50 focus:outline-none">
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/users/travelers/${row.id}`)}>
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info("Edit User coming soon!")}>
          Edit user
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateRoleMutation.mutate({ userId: row.id, role: "OPERATOR" })}
          disabled={updateRoleMutation.isPending}
        >
          Promote to Operator
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onClick={() => toast.info("Deactivate User coming soon!")}
        >
          Deactivate User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
