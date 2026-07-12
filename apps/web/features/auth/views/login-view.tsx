import Link from "next/link";
import { PassengerAuthFlow } from "@/features/auth/components/passenger-auth-flow";
import { AuthHeader } from "@/features/auth/components/auth-header";

type LoginViewProps = {
  errorCode?: string | undefined;
  initialStep?: "input" | "otp" | "profile";
  initialUser?: { email?: string; phone?: string } | undefined;
};

export function LoginView({ errorCode, initialStep, initialUser }: LoginViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <AuthHeader
        type="passenger"
        description="Welcome to Moja Ride! Enter your phone or email to sign in or create an account."
      />
      <PassengerAuthFlow
        initialStep={initialStep}
        initialUser={initialUser}
      />
      <p className="text-xs text-muted-foreground">
        Are you a transport operator?{" "}
        {
          <Link
            href="/operator/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in to Business Portal
          </Link>
        }
      </p>
    </div>
  );
}
