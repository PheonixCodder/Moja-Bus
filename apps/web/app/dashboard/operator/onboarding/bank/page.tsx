import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { BankAccountForm } from "@/features/dashboard/components/onboarding/bank-account-form";

export const metadata = {
  title: "Bank Account - Moja Ride Onboarding",
  description: "Set up your bank account for payouts",
};

export default async function BankPage() {
  const { data: session } = await getServerSession();
  
  if (!session?.session) {
    redirect("/operator/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Set Up Your Bank Account
        </h2>
        <p className="text-slate-600 mt-1">
          Add your bank details to receive payouts from bookings
        </p>
      </div>
      <BankAccountForm />
    </div>
  );
}
