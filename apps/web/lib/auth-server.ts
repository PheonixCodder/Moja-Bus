import { getCsvEnv, getOptionalEnv } from "@moja/config";
import crypto from "crypto";
import { getPrismaClient } from "@moja/db";
import { userRoleValues } from "@moja/schemas/auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins/email-otp";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { nextCookies } from "better-auth/next-js";
import { expo } from "@better-auth/expo";

import { sendAuthOtp, type AuthOtpType } from "./auth-email";

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
    const expoOrigin = process.env["EXPO_DEV_ORIGIN"];
    if (expoOrigin) {
      origins.add(expoOrigin);
    } else {
      origins.add("http://192.168.100.3:8081");
    }
    origins.add("http://localhost:8081");
    origins.add("http://127.0.0.1:8081");
  }

  return [...origins];
}


function resolveBaseUrl(): string {
  // Use Next.js base URL, defaults to 3000
  return (
    getOptionalEnv("BETTER_AUTH_URL", process.env) ?? "http://localhost:3000"
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
      clientId: [webClientId, iosClientId, androidClientId] as string[],
      clientSecret,
      scope: ["email", "profile"] as string[],
      prompt: "select_account" as const,
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
          ...(profile.picture ? { image: profile.picture } : {}),
        };
      },
    },
  };
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
    enabled: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 * 7,  // Refresh if >7 days old
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: "compact",
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/phone-number/send-otp": { window: 60, max: 3 },
      "/sign-in/email-otp": { window: 60, max: 5 },
      "/phone-number/verify": { window: 60, max: 5 },
    },
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
      phoneNumber: {
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
        type: "string",
        defaultValue: "TRAVELER",
        input: true,
      },
    },
  },
  trustedOrigins: collectTrustedOrigins(resolveBaseUrl()),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const prisma = getPrismaClient();
          const userPhone = (user as any).phoneNumber || (user as any).phone;
          const pending = await prisma.pendingOperatorSignup.findFirst({
            where: {
              OR: [
                user.email ? { email: user.email } : null,
                userPhone ? { phone: userPhone as string } : null,
              ].filter(Boolean) as any,
            },
          });

          if (pending) {
            return {
              data: {
                ...user,
                role: "OPERATOR",
                workEmail: pending.email,
                email: user.email || pending.email,
                fullName: pending.ownerName,
                name: pending.ownerName,
                phoneNumber: pending.phone,
              },
            };
          }
        },
        after: async (user) => {
          const prisma = getPrismaClient();
          const userPhone = (user as any).phoneNumber || (user as any).phone;
          const pending = await prisma.pendingOperatorSignup.findFirst({
            where: {
              OR: [
                user.email ? { email: user.email } : null,
                userPhone ? { phone: userPhone as string } : null,
              ].filter(Boolean) as any,
            },
          });

          if (pending) {
            const companyId = crypto.randomUUID();
            const company = await prisma.company.create({
              data: {
                id: companyId,
                name: pending.companyName,
                slug: `draft-${companyId}`,
                email: pending.email,
                phone: pending.phone,
                registrationNumber: `DRAFT-${companyId}`,
                taxId: `DRAFT-${companyId}`,
                estimatedStaffSize: 1,
                status: "DRAFT",
              },
            });

            const operator = await prisma.operator.create({
              data: {
                userId: user.id,
                companyId: company.id,
                role: "OWNER",
              },
            });

            await prisma.operatorOnboarding.create({
              data: {
                operatorId: operator.id,
                currentStep: "COMPANY",
                completedSteps: [],
                completedStepCount: 0,
                totalSteps: 5,
              },
            });

            await prisma.pendingOperatorSignup.delete({
              where: { email: pending.email },
            });

            // Trigger Novu Welcome (fire and forget)
            import("@/lib/novu").then(({ getNovuClient }) => {
              const novu = getNovuClient();
              if (novu) {
                const appUrl = process.env["APP_URL"] || "http://localhost:3000";
                novu.trigger({
                  workflowId: "operator-welcome",
                  to: {
                    subscriberId: user.id,
                    email: user.email,
                    firstName: pending.ownerName.split(" ")[0],
                  },
                  payload: {
                    email: user.email,
                    ownerName: pending.ownerName,
                    companyName: pending.companyName,
                    dashboardUrl: appUrl,
                  },
                  transactionId: `operator-welcome-${user.id}`,
                }).catch(console.error);
              }
            }).catch(console.error);
          }
        },
      },
    },
  },
  plugins: [
    expo(),
    emailOTP({
      sendVerificationOnSignUp: false,
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
        await sendAuthOtp({ identifier: email, otp, type });
      },
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, code }) => {
        await sendAuthOtp({ identifier: phone, otp: code, type: "sign-in" });
      },
    }),
    nextCookies(),
  ],
});

export function getAuthTrustedOrigins(): string[] {
  return collectTrustedOrigins(resolveBaseUrl());
}
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session ?? null;
}

export async function requireServerSession(redirectTo = "/login") {
  const data = await getServerSession();
  if (!data?.session) {
    redirect(redirectTo);
  }
  return { session: data.session, user: data.user };
}

export async function redirectIfAuthenticated(callbackUrl?: string | null) {
  const data = await getServerSession();
  if (!data?.session) return;
  const role = data.user?.role ?? "TRAVELER";
  if (role === "OPERATOR" || role === "ADMIN") {
    redirect("/dashboard/operator");
  }
  if (data.user?.name) {
    const { getSafeCallbackUrl } = await import(
      "@/features/auth/lib/safe-callback-url"
    );
    redirect(getSafeCallbackUrl(callbackUrl, "/dashboard"));
  }
}

export async function getUser() {
  const data = await getServerSession();
  return data?.user ?? null;
}

export type AuthUser = typeof auth.$Infer.Session.user;