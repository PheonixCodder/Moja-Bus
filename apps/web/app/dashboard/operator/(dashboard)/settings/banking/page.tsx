import { BankingView } from "@/features/operator/settings/components/views/banking-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Financials & Payouts - Operator Settings",
};

export default async function BankingSettingsPage() {
  await Promise.all([
    prefetch(trpc.operator.listBankAccounts.queryOptions()),
    prefetch(trpc.payments.listBanks.queryOptions({})),
  ]);

  return (
    <HydrateClient>
      <BankingView />
    </HydrateClient>
  );
}
