import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

type LoginViewProps = {
  errorCode?: string | undefined;
};

export function LoginView({ errorCode }: LoginViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Moja Ride
          <span className="block text-sm font-normal text-muted-foreground">
            Passenger Portal
          </span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Welcome back! Sign in to search routes, book trips, and manage your
          travel.
        </p>
      </div>
      <LoginForm errorCode={errorCode} />
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
