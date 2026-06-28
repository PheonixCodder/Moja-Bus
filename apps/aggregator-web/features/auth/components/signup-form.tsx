"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { AuthCard } from "./auth-card";
import { SocialLogin } from "./social-login";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function SignupForm() {
  const { isPending, signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signUp(fullName, email, password, phone);
  }

  return (
    <AuthCard
      title="Create your account"
      description="Book trips, and keep your Moja Bus travel details in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="ml-1 font-medium text-primary">
            Sign in
          </Link>
        </>
      }
      >

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            required
            disabled={isPending}
          />
        </div>

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
          <Label htmlFor="phone">Phone number</Label>
          <PhoneInput
            id="phone"
            value={phone}
            onChange={(value) => setPhone(value ?? "")}
            placeholder="+225 00 00 00 00"
            autoComplete="tel"
            country="CI"
            defaultCountry="CI"
            international={false}
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <SocialLogin />

    </AuthCard>
  );
}
