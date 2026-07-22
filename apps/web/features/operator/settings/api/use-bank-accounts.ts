import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

export function useBankAccounts() {
  const trpc = useTRPC();
  return useSuspenseQuery({
    ...trpc.operator.listBankAccounts.queryOptions(),
    staleTime: 30_000,
  });
}

export function useDeleteBankAccount() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.operator.deleteBankAccount.mutationOptions({
      onMutate: async (variables) => {
        const queryKey = trpc.operator.listBankAccounts.queryKey();
        await queryClient.cancelQueries({ queryKey });

        const previousAccounts = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          return old.filter((account: any) => account.id !== variables.bankAccountId);
        });

        return { previousAccounts };
      },
      onSuccess: () => {
        toast.success("Bank account removed");
      },
      onError: (err, variables, context) => {
        toast.error(err.message || "Failed to remove bank account");
        if (context?.previousAccounts) {
          queryClient.setQueryData(
            trpc.operator.listBankAccounts.queryKey(),
            context.previousAccounts
          );
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries(trpc.operator.listBankAccounts.queryFilter());
        queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter());
      },
    })
  );
}
