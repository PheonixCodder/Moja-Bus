import { emailOTPClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { ReactAuthClient } from "better-auth/react";

type ClientOptions = {
  baseURL: string;
  plugins: [ReturnType<typeof emailOTPClient>];
};


const baseURL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";
export const authClient: ReactAuthClient<ClientOptions> = createAuthClient({
  baseURL,
  plugins: [emailOTPClient(), inferAdditionalFields({
    user: {
      phone: {
        type: "string",
        required: false,
      },
      role: {
        type: ["TRAVELER", "AGENT", "DRIVER", "OPERATOR", "ADMIN"] as
          const,
        defaultValue: "TRAVELER",
      },
    },
  }),],
});
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
