import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

const tripPayload = z.object({
  email: z.string().optional(),
  type: z.string(),
  tripId: z.string(),
  companyName: z.string(),
  busPlate: z.string().nullable().optional(),
  originName: z.string(),
  destinationName: z.string(),
  departureTime: z.string(),
  bookedPassengers: z.number().int(),
  totalSeats: z.number().int(),
});

type TripPayload = z.infer<typeof tripPayload>;

function emailBody(
  payload: TripPayload,
  opts: { urgent?: boolean; unassigned?: boolean },
) {
  const accent = opts.urgent ? "#e11d48" : "#0081F1";
  const title = opts.unassigned
    ? "Affectation retirée"
    : opts.urgent
      ? "🚨 Départ imminent — vous êtes affecté"
      : "Nouvelle affectation de trajet";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #27272a; border-radius: 12px; padding: 24px; color: #fafafa; background-color: ${opts.urgent ? "#1c1117" : "#09090b"};">
      <h2 style="color: ${accent}; margin-top: 0; font-size: 20px;">${title}</h2>
      <p><strong>${escapeHtml(payload.companyName)}</strong></p>
      <div style="background: #18181b; border-left: 4px solid ${accent}; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px;">
        <p style="margin: 0 0 8px 0;"><strong>${escapeHtml(payload.originName)}</strong> → <strong>${escapeHtml(payload.destinationName)}</strong></p>
        <p style="margin: 0 0 8px 0;">Départ : <strong>${escapeHtml(payload.departureTime)}</strong></p>
        ${payload.busPlate ? `<p style="margin: 0;">Bus : <strong>${escapeHtml(payload.busPlate)}</strong></p>` : ""}
      </div>
      <p style="font-size: 13px; color: #71717a;">${payload.bookedPassengers} / ${payload.totalSeats} passagers réservés. Ouvrez l'application Moja Chauffeur pour voir le trajet.</p>
    </div>
  `;
}

/**
 * Driver — routine trip assignment (departure > 2h away).
 */
export const driverTripAssignedWorkflow = workflow(
  "driver-trip-assigned",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Nouveau trajet assigné",
      body: `${escapeHtml(payload.companyName)} — ${escapeHtml(payload.originName)} → ${escapeHtml(payload.destinationName)}, départ ${escapeHtml(payload.departureTime)}.`,
      avatar: "https://avatar.vercel.sh/route",
      redirect: { url: "/(tabs)/trips", target: "_self" },
    }));
    // Phase 21 (F-NF-05) — Expo tap data routes to /trips.
    await step.push("send-push", async () => ({
      subject: "Nouvelle course affectée",
      body: `${escapeHtml(payload.originName)} → ${escapeHtml(payload.destinationName)} — départ ${escapeHtml(payload.departureTime)}. ${payload.bookedPassengers} passager(s).`,
      overrides: {
        expo: { data: { type: "trip-assigned", tripId: payload.tripId } },
      },
    }));

    await step.email("send-email", async () => ({
      subject: `Trajet assigné : ${escapeHtml(payload.originName)} → ${escapeHtml(payload.destinationName)}`,
      body: emailBody(payload, {}),
    }));
  },
  {
    name: "Driver Trip Assigned",
    description: "Driver assigned to a scheduled trip (standard window)",
    payloadSchema: tripPayload,
  },
);

/**
 * Driver — URGENT assignment departing within the 2-hour window.
 * Drives the full-screen UrgentDispatchModal on mobile.
 */
export const driverDispatchUrgentWorkflow = workflow(
  "driver-dispatch-urgent",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "🚨 Affectation urgente",
      body: `Départ imminent ! ${escapeHtml(payload.originName)} → ${escapeHtml(payload.destinationName)} à ${escapeHtml(payload.departureTime)}. Présentez-vous au départ.`,
      avatar: "https://avatar.vercel.sh/alert",
      redirect: { url: "/(tabs)/trips", target: "_self" },
    }));
    // Phase 21 (F-NF-05) — urgent dispatch is the most tap-critical notice.
    await step.push("send-push", async () => ({
      subject: "🚨 Course urgente",
      body: `${escapeHtml(payload.originName)} → ${escapeHtml(payload.destinationName)} — départ ${escapeHtml(payload.departureTime)}. ${payload.bookedPassengers} passager(s) en attente.`,
      overrides: {
        expo: { data: { type: "dispatch-urgent", tripId: payload.tripId } },
      },
    }));

    await step.email("send-email", async () => ({
      subject: `🚨 URGENT : ${escapeHtml(payload.originName)} → ${escapeHtml(payload.destinationName)} à ${escapeHtml(payload.departureTime)}`,
      body: emailBody(payload, { urgent: true }),
    }));
  },
  {
    name: "Driver Dispatch Urgent",
    description:
      "Urgent dispatch alert when a trip departs within 2 hours of assignment",
    payloadSchema: tripPayload,
  },
);

/**
 * Driver — removed from an assigned trip by the dispatcher.
 */
export const driverTripUnassignedWorkflow = workflow(
  "driver-trip-unassigned",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Affectation retirée",
      body: `Vous n'êtes plus affecté à ${escapeHtml(payload.originName)} → ${escapeHtml(payload.destinationName)} (${escapeHtml(payload.departureTime)}).`,
      avatar: "https://avatar.vercel.sh/minus",
      redirect: { url: "/(tabs)/trips", target: "_self" },
    }));
    // Phase 21 (F-NF-05) — tap data: trip-unassigned.
    await step.push("send-push", async () => ({
      subject: "Affectation retirée",
      body: `Vous n'êtes plus affecté à ${escapeHtml(payload.originName)} → ${escapeHtml(payload.destinationName)}.`,
      overrides: {
        expo: { data: { type: "trip-unassigned", tripId: payload.tripId } },
      },
    }));

    await step.email("send-email", async () => ({
      subject: `Affectation retirée : ${escapeHtml(payload.originName)} → ${escapeHtml(payload.destinationName)}`,
      body: emailBody(payload, { unassigned: true }),
    }));
  },
  {
    name: "Driver Trip Unassigned",
    description: "Dispatcher removed a driver from a trip before departure",
    payloadSchema: tripPayload,
  },
);
