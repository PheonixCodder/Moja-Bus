"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type UserRole = "TRAVELER" | "OPERATOR" | "ADMIN";

export function useAuth() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  // ─── Sign Out ────────────────────────────────────────────────────────────────
  async function signOut() {
    setIsPending(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error &&
        (err.message.includes("network") || err.message.includes("fetch"))
          ? "Network error. Please check your internet connection."
          : "Sign out failed. Please try again.";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────────
  // After OTP verification, reads the live session to get the real role.
  async function verifyEmail(email: string, otp: string) {
    if (!email) {
      toast.error(
        "Your email address is missing. Please go back and sign up again.",
      );
      return { success: false };
    }

    setIsPending(true);
    try {
      const { error } = await authClient.emailOtp.verifyEmail({ email, otp });

      if (error) {
        let message = error.message ?? "Invalid or expired verification code.";

        if (
          error.message?.includes("Invalid code") ||
          error.message?.includes("OTP")
        ) {
          message =
            "Invalid verification code. Please check your inbox for the correct code.";
        } else if (error.message?.includes("expired")) {
          message = "Verification code has expired. Please request a new one.";
        } else if (error.message?.includes("already verified")) {
          message = "This account is already verified. You can sign in now.";
        }

        toast.error(message);
        return { success: false };
      }

      // Read the live session to get the actual role — don't guess from the URL.
      const { data: sessionData } = await authClient.getSession();
      const role = (sessionData?.user as any)?.role as UserRole | undefined;
      const redirectPath =
        role === "OPERATOR" || role === "ADMIN"
          ? "/dashboard/operator/onboarding"
          : "/dashboard";

      toast.success(
        `Email verified. Welcome to ${process.env["NEXT_PUBLIC_APP_NAME"] || "Moja Ride"}!`,
      );
      router.push(redirectPath);
      router.refresh();
      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error &&
        (err.message.includes("network") || err.message.includes("fetch"))
          ? "Network error. Please check your internet connection."
          : "Something went wrong. Please try again.";
      toast.error(message);
      return { success: false };
    } finally {
      setIsPending(false);
    }
  }

  // ─── Passenger OTP Flow (True Passwordless) ──────────────────────────────────
  async function sendPassengerOtp(
    identifier: string,
    method: "phone" | "email",
  ) {
    setIsPending(true);
    try {
      if (method === "phone") {
        const { error } = await authClient.phoneNumber.sendOtp({
          phoneNumber: identifier,
        });
        if (error) throw error;
      } else {
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email: identifier,
          type: "sign-in",
        });
        if (error) throw error;
      }
      toast.success("Verification code sent.");
      return { success: true };
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send verification code.");
      return { success: false };
    } finally {
      setIsPending(false);
    }
  }

  async function verifyPassengerOtp(
    identifier: string,
    otp: string,
    method: "phone" | "email",
  ) {
    setIsPending(true);
    try {
      let result: any;
      if (method === "phone") {
        result = await authClient.phoneNumber.verify({
          phoneNumber: identifier,
          code: otp,
        });
      } else {
        result = await authClient.signIn.emailOtp({ email: identifier, otp });
      }

      if (result.error) throw result.error;

      // Detect if user was just created (createdAt within the last 10 seconds)
      const isNewUser =
        new Date(result.data.user.createdAt).getTime() > Date.now() - 10000;

      toast.success(
        isNewUser ? "Account created successfully!" : "Successfully signed in.",
      );

      return { success: true, isNewUser };
    } catch (err: any) {
      let message = "Invalid verification code.";
      if (err && typeof err === "object") {
        const code = err.code;
        if (code === "TOO_MANY_ATTEMPTS") {
          message = "Too many attempts. Please request a new code or try again later.";
        } else if (code === "INVALID_OTP") {
          message = "Invalid verification code. Please check and try again.";
        } else if (code === "OTP_EXPIRED") {
          message = "Verification code has expired. Please request a new one.";
        } else if (err.message) {
          message = err.message;
        }
      }
      toast.error(message);
      return { success: false };
    } finally {
      setIsPending(false);
    }
  }

  return {
    isPending,
    signOut,
    verifyEmail,
    sendPassengerOtp,
    verifyPassengerOtp,
  };
}
