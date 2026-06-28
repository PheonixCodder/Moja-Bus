"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function useAuth() {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    async function signIn(email: string, password: string) {
        setIsPending(true);
        try {
            const { error } = await authClient.signIn.email({
                email,
                password,
            });

            if (error) {
                toast.error(error.message ?? "Sign in failed. Please try again.");
                return { success: false };
            }

            toast.success("Welcome back to Moja Ride!");
            router.push("/dashboard");
            router.refresh();
            return { success: true };
        } catch {
            toast.error("Something went wrong. Please try again.");
            return { success: false };
        } finally {
            setIsPending(false);
        }
    }

    async function signUp(
        fullName: string,
        email: string,
        password: string,
        phone: string,
    ) {
        setIsPending(true);
        try {
            const { error } = await authClient.signUp.email({
                name: fullName,
                email,
                password,
                phone,
            });

            if (error) {
                toast.error(error.message ?? "Sign up failed. Please try again.");
                return { success: false };
            }

            toast.success("Account created. Check your inbox to verify your email.");
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);
            router.refresh();
            return { success: true };
        } catch {
            toast.error("Something went wrong. Please try again.");
            return { success: false };
        } finally {
            setIsPending(false);
        }
    }

    async function signOut() {
        setIsPending(true);
        try {
            await authClient.signOut();
            router.push("/login");
            router.refresh();
        } catch {
            toast.error("Sign out failed. Please try again.");
        } finally {
            setIsPending(false);
        }
    }

    async function forgotPassword(email: string) {
        setIsPending(true);
        try {
            const { error } = await authClient.emailOtp.requestPasswordReset({
                email,
            });
            if (error) {
                toast.error(error.message ?? "Failed to send reset code.");
                return { success: false };
            }
            toast.success("Password reset code sent. Check your inbox.");
            return { success: true };
        } catch {
            toast.error("Something went wrong. Please try again.");
            return { success: false };
        } finally {
            setIsPending(false);
        }
    }

    async function resetPassword(
        email: string,
        otp: string,
        newPassword: string
    ) {
        setIsPending(true);
        try {
            const { error } = await authClient.emailOtp.resetPassword({
                email,
                otp,
                password: newPassword,
            });
            if (error) {
                toast.error(error.message ?? "Failed to reset password.");
                return { success: false };
            }
            toast.success("Password updated. Please sign in.");
            router.push("/login");
            return { success: true };
        } catch {
            toast.error("Something went wrong. Please try again.");
            return { success: false };
        } finally {
            setIsPending(false);
        }
    }

    async function verifyEmail(email: string, code: string) {
        setIsPending(true);
        try {
            const { error } = await authClient.emailOtp.verifyEmail({
                email,
                otp: code,
            });

            if (error) {
                toast.error(error.message ?? "Invalid or expired verification code.");
                return { success: false };
            }

            toast.success("Email verified. Welcome to Moja Ride!");
            router.push("/dashboard");
            router.refresh();
            return { success: true };
        } catch {
            toast.error("Something went wrong. Please try again.");
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
