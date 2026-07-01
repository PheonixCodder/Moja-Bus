import { getCsvEnv, getOptionalEnv } from "@moja/config";
import { getPrismaClient } from "@moja/db";
import { userRoleValues } from "@moja/schemas/auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins/email-otp";
import { nextCookies } from "better-auth/next-js";

import { sendAuthOtp, type AuthOtpType } from "../lib/auth-email.js";

function collectTrustedOrigins(baseUrl: string): string[] {
  const origins = new Set<string>([
    new URL(baseUrl).origin,
    ...getCsvEnv("ALLOWED_ORIGINS", process.env, [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:19006",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:19006",
    ]),
    "travelerapp://",
  ]);

  if (process.env["NODE_ENV"] === "development") {
    origins.add("exp://");
    origins.add("exp://**");
    // Add specific Expo dev server origins
    origins.add("http://192.168.100.3:8081");
    origins.add("http://localhost:8081");
    origins.add("http://127.0.0.1:8081");
  }

  return [...origins];
}

function resolveBaseUrl(): string {
  return (
    getOptionalEnv("BETTER_AUTH_URL", process.env) ?? "http://localhost:4000"
  );
}

type GoogleProfile = {
  name?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  email?: string | null;
  picture?: string | null;
};

function resolveGoogleProvider() {
  const webClientId = getOptionalEnv("GOOGLE_WEB_CLIENT_ID", process.env);
  const iosClientId = getOptionalEnv("GOOGLE_IOS_CLIENT_ID", process.env);
  const androidClientId = getOptionalEnv(
    "GOOGLE_ANDROID_CLIENT_ID",
    process.env,
  );
  const clientSecret = getOptionalEnv("GOOGLE_CLIENT_SECRET", process.env);

  if (!webClientId || !iosClientId || !androidClientId || !clientSecret) {
    return null;
  }

  return {
    google: {
      clientId: [webClientId, iosClientId, androidClientId],
      clientSecret,
      scope: ["email", "profile"],
      prompt: "select_account",
      mapProfileToUser: (profile: GoogleProfile) => {
        const profileName =
          profile.name ??
          [profile.given_name, profile.family_name]
            .filter(Boolean)
            .join(" ")
            .trim();
        const fallbackName = profile.email?.split("@")[0] ?? "Traveler";

        return {
          name: profileName || fallbackName,
          image: profile.picture ?? undefined,
        };
      },
    },
  } as const;
}

export const auth = betterAuth({
  baseURL: resolveBaseUrl(),
  database: prismaAdapter(getPrismaClient(), {
    provider: "postgresql",
  }),
  emailVerification: {
    autoSignInAfterVerification: true,
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
  },
  account: {
    accountLinking: {
      updateUserInfoOnLink: true,
    },
  },
  socialProviders: resolveGoogleProvider() ?? {},
  user: {
    fields: {
      name: "fullName",
    },
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      workEmail: {
        type: "string",
        required: false,
        input: true,
      },
      role: {
        type: userRoleValues as any,
        defaultValue: "TRAVELER",
        input: true,
      },
    },
  },
  trustedOrigins: collectTrustedOrigins(resolveBaseUrl()),
  plugins: [
    nextCookies(),
    emailOTP({
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({
        email,
        otp,
        type,
      }: {
        email: string;
        otp: string;
        type: AuthOtpType;
      }) {
        await sendAuthOtp({ email, otp, type: type as AuthOtpType });
      },
    }),
  ],
});

export function getAuthTrustedOrigins(): string[] {
  return collectTrustedOrigins(resolveBaseUrl());
}
