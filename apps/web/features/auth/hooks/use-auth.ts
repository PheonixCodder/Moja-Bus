"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type UserRole = "TRAVELER" | "OPERATOR" | "ADMIN";

function resolveRoleDashboard(role: UserRole | string | undefined): string {
  if (role === "OPERATOR" || role === "ADMIN") return "/dashboard/operator";
  return "/dashboard";
}

export function useAuth() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  // ─── Sign In ────────────────────────────────────────────────────────────────
  async function signIn(email: string, password: string) {
    setIsPending(true);
    try {
      const { error, data } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        let message = error.message ?? "Sign in failed. Please try again.";

        if (
          error.message?.includes("Invalid credentials") ||
          error.message?.includes("Invalid password") ||
          error.message?.includes("User not found")
        ) {
          message = "Invalid email or password.";
        } else if (
          error.message?.includes("not verified") ||
          error.message?.includes("verify")
        ) {
          message =
            "Please verify your email before signing in. Check your inbox.";
        } else if (
          error.message?.includes("suspended") ||
          error.message?.includes("disabled") ||
          error.message?.includes("banned")
        ) {
          message = "Your account has been disabled. Please contact support.";
        } else if (
          error.message?.includes("Rate limit") ||
          error.message?.includes("Too many")
        ) {
          message = "Too many attempts. Please wait a few minutes.";
        }

        toast.error(message);
        return { success: false };
      }

      // Better Auth returns { user, session } — not { session: { user } }
      const user = data?.user;
      const redirectPath = resolveRoleDashboard(user?.role);

      toast.success(`Welcome back to ${process.env["NEXT_PUBLIC_APP_NAME"] || "Moja Ride"}!`);
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

  // ─── Sign Up ─────────────────────────────────────────────────────────────────
  async function signUp(
    fullName: string,
    email: string,
    password: string,
    phone: string,
    role?: "TRAVELER" | "OPERATOR" | "ADMIN",
    workEmail?: string,
  ) {
    setIsPending(true);
    try {
      const { error } = await authClient.signUp.email({
        name: fullName,
        email,
        password,
        ...(phone && { phone }),
        ...(role && { role }),
        ...(workEmail && { workEmail }),
      } as any);

      if (error) {
        let message = error.message ?? "Sign up failed. Please try again.";

        if (
          error.code === "P2002" ||
          error.message?.includes("Unique constraint failed")
        ) {
          const field = error.message?.match(/\((`?[^)]+`?)\)/)?.[1] ?? "";
          if (field.includes("phone")) {
            message =
              "This phone number is already registered. Please use a different number.";
          } else if (field.toLowerCase().includes("workemail")) {
            message =
              "This work email is already registered. Please use a different email.";
          } else if (field.includes("email")) {
            message =
              "This email is already registered. Please use a different email.";
          } else {
            message = "An account with these details already exists.";
          }
        } else if (
          error.message?.includes("Rate limit") ||
          error.message?.includes("Too many")
        ) {
          message = "Too many attempts. Please wait a few minutes.";
        }

        toast.error(message);
        return { success: false };
      }

      // Manually send verification OTP for non-operators (passengers) since auto-send is disabled
      if (role !== "OPERATOR") {
        try {
          await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
          });
        } catch (err) {
          console.error("Failed to send verification OTP:", err);
        }
      }

      const verifyPath =
        role === "OPERATOR" ? "/operator/verify-email" : "/verify-email";
      toast.success("Account created! Check your inbox to verify your email.");
      router.push(`${verifyPath}?email=${encodeURIComponent(email)}`);
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

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  async function forgotPassword(email: string) {
    setIsPending(true);
    try {
      const { error } = await authClient.emailOtp.requestPasswordReset({
        email,
      });

      if (error) {
        let message = error.message ?? "Failed to send reset code.";

        if (error.message?.includes("User not found")) {
          message = "No account found with this email.";
        } else if (
          error.message?.includes("Rate limit") ||
          error.message?.includes("Too many")
        ) {
          message = "Too many requests. Please wait before trying again.";
        }

        toast.error(message);
        return { success: false };
      }

      toast.success("Reset code sent. Check your inbox.");
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

  // ─── Reset Password ───────────────────────────────────────────────────────────
  // userType determines where to redirect after a successful reset.
  async function resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    userType: "passenger" | "operator" = "passenger",
  ) {
    setIsPending(true);
    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password: newPassword,
      });

      if (error) {
        let message = error.message ?? "Failed to reset password.";

        if (
          error.message?.includes("Invalid code") ||
          error.message?.includes("OTP")
        ) {
          message = "Invalid or expired code. Please request a new one.";
        } else if (error.message?.includes("Password")) {
          message = "Password does not meet requirements.";
        }

        toast.error(message);
        return { success: false };
      }

      toast.success("Password updated. Please sign in.");
      // Send operator back to operator login, passenger to passenger login.
      router.push(userType === "operator" ? "/operator/login" : "/login");
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

  // ─── Verify Email ─────────────────────────────────────────────────────────────
  // After verification, we read the live session to get the real role
  // instead of trusting the URL prop.
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
      const role = sessionData?.user?.role as UserRole | undefined;
      const redirectPath =
        role === "OPERATOR" || role === "ADMIN"
          ? "/dashboard/operator/onboarding"
          : "/dashboard";

      toast.success(`Email verified. Welcome to ${process.env['NEXT_PUBLIC_APP_NAME'] || "Moja Ride"}!`);
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

  return {
    isPending,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
    verifyEmail,
  };
}
