import {emailOTPClient, inferAdditionalFields} from "better-auth/client/plugins";
import {createAuthClient} from "better-auth/react";
import type {ReactAuthClient} from "better-auth/react";


// Custom types for our extended user and session
export interface CustomUser {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    role: "TRAVELER" | "OPERATOR" | "ADMIN";
    phone?: string;
    workEmail?: string;
}

export interface CustomSession {
    user: CustomUser;
    expiresAt: Date;
}

const baseURL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";
export const authClient = createAuthClient({
    baseURL,
    plugins: [emailOTPClient(), inferAdditionalFields({
        user: {
            phone: {
                type: "string",
                required: false,
            },
            role: {
                type: ["TRAVELER", "OPERATOR", "ADMIN"] as
                    const,
                defaultValue: "TRAVELER",
            },
        },
    }),],
});
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
