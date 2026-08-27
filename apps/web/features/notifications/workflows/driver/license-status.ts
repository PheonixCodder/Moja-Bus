import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Phase 14 (F-OP-03/F-DV-12) — driver licence lifecycle notices, sent to the
 * driver and their active-roster operators. Two kinds:
 *   EXPIRING_SOON  — crossed the 30-day window; deduped per month via the
 *                    transactionId bucket (no warned-state column needed).
 *   EXPIRED        — the nightly VERIFIED→EXPIRED flip happened; this fires
 *                    exactly once because the transition itself is one-way.
 */
export const driverLicenseStatusPayloadSchema = z.object({
  kind: z.enum(["EXPIRING_SOON", "EXPIRED"]),
  driverName: z.string(),
  expiryDate: z.string(),
  companyName: z.string().nullable().optional(),
  email: z.string().email().optional(),
});

export const driverLicenseStatusWorkflow = workflow(
  "driver-license-status",
  async ({ step, payload }) => {
    const expired = payload.kind === "EXPIRED";
    await step.inApp("send-in-app", async () => ({
      subject: expired ? "Permis de conduire expiré" : "Permis bientôt expiré",
      body: expired
        ? `Le permis de ${escapeHtml(payload.driverName)} a expiré le ${escapeHtml(payload.expiryDate)}. Affectations et courses verrouillées jusqu'à renouvellement.`
        : `Le permis de ${escapeHtml(payload.driverName)} expire le ${escapeHtml(payload.expiryDate)}. Planifiez le renouvellement.`,
      avatar: expired
        ? "https://avatar.vercel.sh/license-expired"
        : "https://avatar.vercel.sh/license-soon",
    }));
    await step.email("send-email", async () => {
      return {
        subject: expired
          ? `🚨 Permis expiré — ${escapeHtml(payload.driverName)}`
          : `Permis bientôt expiré (30 jours) — ${escapeHtml(payload.driverName)}`,
        body: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;"><h2 style="color:${expired ? "#dc2626" : "#d97706"};">${expired ? "Permis de conduire expiré" : "Renouvellement de permis requis"}</h2><p>Bonjour,</p><p>Le permis de conduire de <strong>${escapeHtml(payload.driverName)}</strong> ${expired ? `a <strong>expiré</strong> le` : `arrive à expiration le`} <strong>${escapeHtml(payload.expiryDate)}</strong>${payload.companyName ? ` chez <strong>${escapeHtml(payload.companyName)}</strong>` : ""}.</p><p style="color:#64748b;font-size:13px;">${expired ? "Les affectations, gardes et démarrages de course sont verrouillés pour ce chauffeur jusqu'à la mise à jour du document et une nouvelle vérification." : "Merci de planifier le renouvellement afin d'éviter tout blocage d'affectation."}</p></div>`,
      };
    });
  },
  {
    name: "Driver License Status",
    description:
      "Warns 30 days before a driver's license expires and notifies on expiry",
    payloadSchema: driverLicenseStatusPayloadSchema,
  },
);
