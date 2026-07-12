import {
  emailOTPClient,
  phoneNumberClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth-server";

export const authClient = createAuthClient({
  plugins: [emailOTPClient(), phoneNumberClient(), inferAdditionalFields<typeof auth>()],
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

export const { useSession, signIn, signUp, signOut } = authClient;
