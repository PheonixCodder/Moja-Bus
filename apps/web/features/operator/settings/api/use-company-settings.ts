import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useCompanySettings() {
  const trpc = useTRPC();
  return useSuspenseQuery({
    ...trpc.operator.getSettings.queryOptions(),
    staleTime: 30_000,
  });
}
