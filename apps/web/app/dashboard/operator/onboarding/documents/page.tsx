import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { DocumentsForm } from "@/features/dashboard/components/onboarding/documents-form";

export const metadata = {
  title: "Business Documents - Moja Ride Onboarding",
  description: "Upload verification documents for your transport business",
};

export default async function DocumentsPage() {
  const { data: session } = await getServerSession();
  
  if (!session?.session) {
    redirect("/operator/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Verify Your Business
        </h2>
        <p className="text-slate-600 mt-1">
          Upload required documents to verify your transport business and start accepting bookings
        </p>
      </div>
      <DocumentsForm />
    </div>
  );
}
