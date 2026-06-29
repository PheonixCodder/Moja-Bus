import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { CompanyProfileForm } from "@/features/dashboard/components/onboarding/company-profile-form";

export const metadata = {
  title: "Company Profile - Moja Ride Onboarding",
  description: "Tell us about your transport business",
};

export default async function CompanyProfilePage() {
  const { data: session } = await getServerSession();
  
  if (!session?.session) {
    redirect("/operator/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Let's set up your company profile
        </h2>
        <p className="text-slate-600 mt-1">
          This information helps passengers find and trust your business
        </p>
      </div>
      <CompanyProfileForm />
    </div>
  );
}
