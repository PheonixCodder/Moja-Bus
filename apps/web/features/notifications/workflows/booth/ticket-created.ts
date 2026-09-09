import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Phase B2 — Booth ticket created notification.
 * Triggered after any booth sale is confirmed (cash or Paystack).
 * Sent to the passenger who purchased the ticket at the counter.
 */
export const boothTicketCreatedWorkflow = workflow(
  "booth-ticket-created",
  async ({ step, payload }) => {
    await step.email("send-email", async () => {
      const seatDisplay = payload.seatNumber ?? "Auto-assigné";
      const amountFormatted = payload.amountXOF.toLocaleString("fr-CI");
      const hasAccountSection = payload.isNewAccount
        ? `<div style="margin-top:24px;padding-top:20px;border-top:1px dashed #cbd5e1;">
            <p style="font-size:13px;color:#475569;margin:0 0 8px;">
              Votre compte Moja Ride a été créé avec cette adresse e-mail.
            </p>
            <a href="${payload.verificationUrl}" style="display:inline-block;background:#0081F1;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">
              Activer mon compte
            </a>
            <p style="font-size:11px;color:#94a3b8;margin-top:8px;">
              Ce lien est valable 48 heures.
            </p>
          </div>`
        : "";

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #0081F1; margin-top: 0; font-size: 22px; font-weight: bold; letter-spacing: -0.5px;">
            Votre billet Moja Ride
          </h1>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">
            Bonjour ${escapeHtml(payload.passengerName)},
          </p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">
            Votre billet a été enregistré au guichet Moja Ride.
          </p>

          <div style="background: #f8fafc; border-left: 4px solid #0081F1; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #334155;">
            <p style="margin: 0 0 8px 0;">
              Référence : <strong>${escapeHtml(payload.bookingReference)}</strong>
            </p>
            <p style="margin: 0 0 8px 0;">
              Trajet : <strong>${escapeHtml(payload.originTerminalName)} → ${escapeHtml(payload.destTerminalName)}</strong>
            </p>
            <p style="margin: 0 0 8px 0;">
              Départ : <strong>${escapeHtml(payload.departureDate)}</strong>
            </p>
            <p style="margin: 0 0 8px 0;">
              Siège : <strong>${escapeHtml(seatDisplay)}</strong>
            </p>
            <p style="margin: 0;">
              Montant : <strong>${amountFormatted} XOF</strong>
            </p>
          </div>

          <p style="font-size: 13px; line-height: 1.5; color: #475569; text-align: center; margin: 20px 0;">
            Présentez le QR code ci-dessous à l'embarquement :
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload.ticketToken)}"
              alt="QR Code Ticket"
              style="border: 2px solid #ffffff; border-radius: 8px; padding: 8px; background: #ffffff;"
            />
          </div>

          ${hasAccountSection}

          <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
            L'équipe Moja Ride
          </p>
        </div>
      `;

      return {
        subject: `Votre billet Moja Ride — ${payload.bookingReference}`,
        body: html,
      };
    });
  },
  {
    name: "Booth Ticket Created",
    description:
      "Sends email ticket confirmation with QR code after a booth sale is completed (cash or Paystack)",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      passengerName: z.string(),
      bookingReference: z.string(),
      originTerminalName: z.string(),
      destTerminalName: z.string(),
      departureDate: z.string(),
      seatNumber: z.string().nullable(),
      amountXOF: z.number(),
      ticketToken: z.string(),
      isNewAccount: z.boolean(),
      verificationUrl: z.string().optional(),
    }),
  },
);
