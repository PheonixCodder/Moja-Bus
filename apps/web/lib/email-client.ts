import "server-only";

import { getOptionalEnv } from "@moja/config";
import { Resend } from "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = getOptionalEnv("RESEND_API_KEY");
  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

function getEmailFrom(): string {
  return (
    getOptionalEnv("EMAIL_FROM") ?? "Moja Ride <onboarding@resend.dev>"
  );
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<void> {
  const client = getResendClient();

  if (!client) {
    console.log(
      [
        "",
        "[EMAIL] Resend not configured — logging email instead",
        `To: ${to}`,
        `Subject: ${subject}`,
        text ?? html.replace(/<[^>]+>/g, " "),
        "",
      ].join("\n"),
    );
    return;
  }

  const { error } = await client.emails.send({
    from: getEmailFrom(),
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });

  if (error) {
    throw new Error(error.message || "Failed to send email");
  }
}

export function resolveAppBaseUrl(): string {
  return (
    getOptionalEnv("BETTER_AUTH_URL") ??
    getOptionalEnv("APP_URL") ??
    "http://localhost:3000"
  );
}
