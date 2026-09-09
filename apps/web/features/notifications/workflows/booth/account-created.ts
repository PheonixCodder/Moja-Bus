import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Phase B2 — Booth account created notification.
 * Triggered when a new TRAVELER account is created at the booth counter.
 * The verificationUrl is generated at dispatch time in the outbox worker
 * to ensure the link is always fresh and hasn't expired.
 */
export const boothAccountCreatedWorkflow = workflow(
  "booth-account-created",
  async ({ step, payload }) => {
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #0081F1; margin-top: 0; font-size: 22px; font-weight: bold; letter-spacing: -0.5px;">
            Bienvenue sur Moja Ride
          </h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">
            Bonjour ${escapeHtml(payload.passengerName)},
          </p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">
            Un compte Moja Ride vient d'être créé pour vous au guichet de ${escapeHtml(payload.terminalName)}.
          </p>

          <div style="margin: 20px 0; font-size: 14px; color: #334155;">
            <p style="margin: 0 0 8px 0;">
              Votre adresse e-mail : <strong>${escapeHtml(payload.email)}</strong>
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${payload.verificationUrl}" style="display: inline-block; background: #0081F1; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px;">
              Activer mon compte
            </a>
          </div>

          <p style="font-size: 13px; color: #94a3b8;">
            Ce lien est valable 48 heures.
          </p>

          <p style="font-size: 13px; color: #64748b; margin-top: 16px;">
            Si vous n'avez pas acheté de billet aujourd'hui, ignorez cet e-mail.
          </p>

          <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
            L'équipe Moja Ride
          </p>
        </div>
      `;

      return {
        subject: "Bienvenue sur Moja Ride — Activez votre compte",
        body: html,
      };
    });
  },
  {
    name: "Booth Account Created",
    description:
      "Notifies passengers when a new TRAVELER account is created at the booth counter, with email verification link",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      passengerName: z.string(),
      email: z.string().email(),
      terminalName: z.string(),
      verificationUrl: z.string(),
    }),
  },
);
