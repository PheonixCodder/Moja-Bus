import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Phase 25 (F-OP-09) — platform verification outcome notice. Fired from
 * admin.verifyDriver inside the same flow as the status flip; the
 * verification dialog always claimed "Displayed to Driver" — this makes it
 * true. fr-first per workspace rules.
 */
export const driverVerificationOutcomePayloadSchema = z.object({
  kind: z.enum(["APPROVE", "REJECT", "SUSPEND"]),
  driverName: z.string(),
  reason: z.string().nullable().optional(),
  email: z.string().email().optional(),
});

export const driverVerificationOutcomeWorkflow = workflow(
  "driver-verification-outcome",
  async ({ step, payload }) => {
    const approved = payload.kind === "APPROVE";
    const suspended = payload.kind === "SUSPEND";

    await step.inApp("send-in-app", async () => ({
      subject: approved
        ? "Vérification approuvée"
        : suspended
          ? "Compte suspendu"
          : "Vérification refusée",
      body: approved
        ? "Votre profil chauffeur est vérifié. Vous pouvez commencer votre activité sur Moja Ride."
        : suspended
          ? `Votre compte a été suspendu par l'administration.${payload.reason ? ` Motif : ${escapeHtml(payload.reason)}` : ""}`
          : `Votre vérification a été refusée.${payload.reason ? ` Motif : ${escapeHtml(payload.reason)}` : ""}`,
      avatar: approved
        ? "https://avatar.vercel.sh/verified"
        : "https://avatar.vercel.sh/suspended",
    }));

    await step.email("send-email", async () => {
      const title = approved
        ? "Vérification approuvée"
        : suspended
          ? "Compte suspendu"
          : "Vérification refusée";
      const color = approved ? "#10b981" : "#dc2626";
      return {
        subject: `Moja Ride — ${title}`,
        body: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;"><h2 style="color:${color};">${title}</h2><p>Bonjour <strong>${escapeHtml(payload.driverName)}</strong>,</p><p>${
          approved
            ? "Votre profil chauffeur est désormais <strong>vérifié</strong>. Bienvenue à bord."
            : suspended
              ? "Votre compte chauffeur a été <strong>suspendu</strong> par l'administration."
              : "Votre demande de vérification a été <strong>refusée</strong>."
        }${payload.reason ? `</p><p style="color:#52525b;"><em>Motif : ${escapeHtml(payload.reason)}</em></p>` : ""}${
          approved
            ? ""
            : '<p style="color:#64748b;font-size:13px;">Contactez votre opérateur ou le support Moja Ride pour les prochaines étapes.</p>'
        }</div>`,
      };
    });
  },
  {
    name: "Driver Verification Outcome",
    description:
      "Notifies the driver when platform verification is approved, rejected, or suspended",
    payloadSchema: driverVerificationOutcomePayloadSchema,
  }
);
