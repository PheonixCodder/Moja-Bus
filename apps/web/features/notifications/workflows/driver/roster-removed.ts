import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Phase 13 (F-OP-02) — fired when an operator removes a driver from their
 * roster (deleteDriverAffiliation). Distinct from `driver-affiliation-ended`:
 * that workflow's copy is exclusive-contract-specific ("a rejoint …"), which
 * would read as nonsense for an operator-initiated removal.
 *
 * fr-first per workspace rules. No redirect — the recipient is a driver whose
 * routing surface is the driver app, not the operator ERP.
 */
export const driverRosterRemovedPayloadSchema = z.object({
  driverName: z.string(),
  companyName: z.string(),
  email: z.string().email().optional(),
});

export const driverRosterRemovedWorkflow = workflow(
  "driver-roster-removed",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Affiliation résiliée",
      body: `${escapeHtml(payload.companyName)} a mis fin à votre affiliation sur Moja Ride. Contactez l'opérateur pour plus de détails.`,
      avatar: "https://avatar.vercel.sh/driver",
    }));
    await step.email("send-email", async () => {
      return {
        subject: `Votre affiliation Moja Ride chez ${escapeHtml(payload.companyName)} a été résiliée`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><h2 style="color:#dc2626;">Affiliation résiliée</h2><p>Bonjour <strong>${escapeHtml(payload.driverName)}</strong>,</p><p>L'opérateur <strong>${escapeHtml(payload.companyName)}</strong> a mis fin à votre affiliation sur Moja Ride. Vous n'apparaîtrez plus dans son effectif ni dans ses affectations de trajets.</p><p style="color:#64748b; font-size:13px;">Si vous pensez qu'il s'agit d'une erreur, contactez directement l'opérateur. Votre profil Moja (notes, badges, historique) reste le vôtre et peut être réactivé par un autre opérateur.</p></div>`,
      };
    });
  },
  {
    name: "Driver Roster Removed",
    description:
      "Notifies a driver when an operator removes them from their roster",
    payloadSchema: driverRosterRemovedPayloadSchema,
  },
);
