import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Phase 34 ride-along — the payload now carries ISO (`busyUntilIso`); the
 * workflow owns display formatting. timeZone stays UTC because Côte d'Ivoire
 * is UTC+0 year-round — this IS local time.
 */
function formatBusyUntil(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** Phase 34 (F-NF-14) — exported for the enqueue↔payloadSchema contract harness. */
export const operatorDriverAssignmentConflictPayloadSchema = z.object({
  // Optional: phone-first operators may have no email; the alert must still
  // fire (in-app delivers regardless).
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  driverName: z.string(),
  delayedRoute: z.string(),
  conflictRoute: z.string(),
  conflictCompany: z.string().nullable().optional(),
  busyUntilIso: z.string(),
  tripId: z.string(),
});

/**
 * Phase 19 (P3-5) — fires when a delay-shifted departure makes an assigned
 * driver's schedule overlap another trip. Throttled upstream via outbox
 * idempotency keys (per trip+driver+conflict+day), so creeping delays don't
 * spam operators.
 */
export const operatorDriverAssignmentConflictWorkflow = workflow(
  "operator-driver-assignment-conflict",
  async ({ step, payload }) => {
    const busyUntil = formatBusyUntil(payload.busyUntilIso);
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #dc2626; margin-top: 0; font-size: 22px; font-weight: bold;">Conflit d'affectation détecté</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">Après le retard enregistré, le chauffeur <strong>${escapeHtml(payload.driverName)}</strong> est désormais en conflit d'horaire.</p>
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #991b1b;">
            <p style="margin: 0 0 8px 0;">Trajet retardé : <strong>${escapeHtml(payload.delayedRoute)}</strong></p>
            <p style="margin: 0 0 8px 0;">Entre en conflit avec : <strong>${escapeHtml(payload.conflictRoute)}</strong>${payload.conflictCompany ? ` (${escapeHtml(payload.conflictCompany)})` : ""}</p>
            <p style="margin: 0;">Le chauffeur est occupé jusqu'à : <strong>${escapeHtml(busyUntil)}</strong> (estimation)</p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">Ouvrez le tableau de bord de dispatch pour réaffecter ce trajet si nécessaire.</p>
        </div>
      `;
      return {
        subject: "Dispatch : conflit d'horaire chauffeur après retard",
        body: html,
      };
    });

    await step.inApp("send-in-app", async () => ({
      subject: "Conflit d'affectation",
      body: `${escapeHtml(payload.driverName)} : ${escapeHtml(payload.delayedRoute)} entre en conflit avec ${escapeHtml(payload.conflictRoute)} jusqu'à ${escapeHtml(busyUntil)}.`,
      avatar: "https://avatar.vercel.sh/conflict",
      redirect: { url: "/dashboard/operator/trips", target: "_self" },
    }));
  },
  {
    name: "Operator Driver Assignment Conflict",
    description:
      "Alerts operators when a delay-shifted departure creates a scheduling overlap for an assigned driver",
    preferences: {
      all: { readOnly: true },
    },
    payloadSchema: operatorDriverAssignmentConflictPayloadSchema,
  }
);
