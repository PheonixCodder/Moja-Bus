import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { TermsForm } from "@/features/dashboard/components/onboarding/terms-form";

export const metadata = {
  title: "Terms & Agreement - Moja Ride Onboarding",
  description: "Review and accept terms to complete onboarding",
};

export default async function TermsPage() {
  const { data: session } = await getServerSession();
  
  if (!session?.session) {
    redirect("/operator/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Review & Accept Terms
        </h2>
        <p className="text-slate-600 mt-1">
          Final step - review our terms and commission structure
        </p>
      </div>
      <TermsForm />
    </div>
  );
}
