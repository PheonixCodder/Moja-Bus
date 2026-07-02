import Link from "next/link";
import { SignupForm } from "@/features/auth/components/signup-form";
import { AuthHeader } from "@/features/auth/components/auth-header";

export function SignupView() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type="passenger"
        description="Join thousands of travelers. Create your passenger account to search routes, book trips, and manage your bookings in one place."
      />
      <SignupForm role="TRAVELER" />
      <p className="text-xs text-muted-foreground">
        Are you a transport operator?{" "}
        {
          <Link
            href="/operator/signup"
            className="font-medium text-primary hover:underline"
          >
            Register as Business
          </Link>
        }
      </p>
    </div>
  );
}
