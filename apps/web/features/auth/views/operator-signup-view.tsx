import Link from "next/link";
import { OperatorSignupForm } from "@/features/auth/components/operator-signup-form";
import { AuthHeader } from "@/features/auth/components/auth-header";

export function OperatorSignupView() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type="operator"
        description="Register your transport business to manage fleet, routes, and bookings — and join the Moja Ride operator network."
      />

      <OperatorSignupForm />

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-xs text-muted-foreground">
          Already have a business account?{" "}
          <Link
            href="/operator/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
        <p className="text-xs text-muted-foreground">
          Are you a passenger?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Create Passenger Account
          </Link>
        </p>
      </div>
    </div>
  );
}
