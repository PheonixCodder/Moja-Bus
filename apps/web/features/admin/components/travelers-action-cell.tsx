"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import type { TravelerRow } from "./travelers-columns";

export function TravelerActionCell({ row }: { row: TravelerRow }) {
  const t = useTranslations("adminDashboard.travelersActionCell");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const updateRoleMutation = useMutation({
    ...trpc.admin.updateUserRole.mutationOptions(),
    onSuccess: () => {
      toast.success(t("promotedToOperator"));
      queryClient.invalidateQueries(trpc.admin.listUsers.pathFilter());
    },
    onError: (err: any) => {
      toast.error(err.message || t("failedToUpdateRole"));
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-md p-0 text-muted-foreground hover:bg-muted/50 focus:outline-none">
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            router.push(`/dashboard/admin/users/travelers/${row.id}`)
          }
        >
          {t("viewProfile")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info(t("editUserComingSoon"))}>
          {t("editUser")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            updateRoleMutation.mutate({ userId: row.id, role: "OPERATOR" })
          }
          disabled={updateRoleMutation.isPending}
        >
          {t("promoteToOperator")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onClick={() => toast.info(t("deactivateUserComingSoon"))}
        >
          {t("deactivateUser")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
