import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Phase B2 — Booth urban conflict notification.
 * Triggered when the booth offline sync detects urban trip overbooking.
 * Fans out to all MANAGER/ADMIN/OWNER operators of the company.
 * The outbox worker creates one message per recipient (see enqueue logic).
 */
export const boothUrbanConflictWorkflow = workflow(
  "booth-urban-conflict",
  async ({ step, payload }) => {
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #dc2626; margin-top: 0; font-size: 20px; font-weight: bold;">
            ⚠️ Conflit de capacité
          </h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">
            Alerte Guichet Moja Ride,
          </p>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">
            Un conflit de capacité a été détecté suite à des ventes hors ligne.
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #991b1b;">
            <p style="margin: 0 0 8px 0;">
              Trajet : <strong>${escapeHtml(payload.tripRoute)}</strong>
            </p>
            <p style="margin: 0 0 8px 0;">
              Date : <strong>${escapeHtml(payload.tripDate)}</strong>
            </p>
            <p style="margin: 0 0 8px 0;">
              Excès : <strong>${payload.excessCount} réservation(s)</strong> au-delà de la capacité
            </p>
            <p style="margin: 0 0 8px 0;">
              Agent : <strong>${escapeHtml(payload.staffName)}</strong> — Terminal : <strong>${escapeHtml(payload.terminalName)}</strong>
            </p>
          </div>

          <p style="font-size: 13px; color: #475569;">
            Consultez le tableau de bord opérateur pour résoudre ce conflit :
          </p>
          <p style="font-size: 13px; color: #475569; margin-top: 4px;">
            <a href="${payload.tripLink}" style="color: #0081F1; text-decoration: none; font-weight: 500;">
              Voir le voyage
            </a>
          </p>

          <p style="font-size: 13px; color: #64748b; margin-top: 16px;">
            Examinez les réservations ci-dessous et annulez les excédentaires si nécessaire.
          </p>

          <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
            L'équipe Moja Ride
          </p>
        </div>
      `;

      return {
        subject: `⚠️ Conflit de capacité — ${payload.tripRoute} (${payload.tripDate})`,
        body: html,
      };
    });
  },
  {
    name: "Booth Urban Conflict",
    description:
      "Alerts company managers/admins/owners when offline booth sales exceed urban trip capacity",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: z.object({
      tripRoute: z.string(),
      tripDate: z.string(),
      excessCount: z.number(),
      staffName: z.string(),
      terminalName: z.string(),
      tripLink: z.string().url(),
    }),
  },
);
