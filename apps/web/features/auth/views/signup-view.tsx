import Link from "next/link";
import { PassengerAuthFlow } from "@/features/auth/components/passenger-auth-flow";
import { AuthHeader } from "@/features/auth/components/auth-header";

export function SignupView() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type="passenger"
        description="Join thousands of travelers. Enter your phone or email to sign in or create an account."
      />
      <PassengerAuthFlow />
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
