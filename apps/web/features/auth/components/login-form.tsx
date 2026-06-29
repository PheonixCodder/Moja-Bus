"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { AuthCard } from "./auth-card";
import { SocialLogin } from "./social-login";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getAuthErrorMessage } from "@/features/auth/lib/auth-errors";

type LoginFormProps = {
  errorCode?: string | undefined;
};

export function LoginForm({ errorCode }: LoginFormProps) {
  const { isPending, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const errorMessage = getAuthErrorMessage(errorCode);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signIn(email, password);
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your Moja Ride passenger account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="ml-1 font-medium text-primary">
            Sign up
          </Link>
        </>
      }
    >
      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}


      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            autoComplete="current-password"
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <SocialLogin />

    </AuthCard>
  );
}


