import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

const EMPLOYMENT_LABELS: Record<string, string> = {
  EXCLUSIVE_INTERCITY: "Intercity exclusif",
  CONTRACTOR_URBAN: "Contractuel urbain",
  HYBRID: "Hybride",
};

const basePayload = z.object({
  offerId: z.string(),
});

/**
 * Driver — new employment offer received.
 */
export const driverOfferReceivedWorkflow = workflow(
  "driver-offer-received",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Nouvelle offre d'emploi",
      body: `${escapeHtml(payload.companyName)} vous propose ${payload.salaryCFA} FCFA/mois (${EMPLOYMENT_LABELS[payload.employmentType] ?? payload.employmentType}). Répondez avant expiration.`,
      avatar: "https://avatar.vercel.sh/briefcase",
      redirect: { url: "/(tabs)/offers", target: "_self" },
    }));

    // Phase 21 (F-NF-05) — Expo tap data routes to /offers.
    await step.push("send-push", async () => ({
      subject: "Nouvelle offre d'emploi",
      body: `${escapeHtml(payload.companyName)} propose ${payload.salaryCFA} FCFA/mois.`,
      overrides: {
        expo: {
          data: { type: "driver-offer-received", offerId: payload.offerId },
        },
      },
    }));

    await step.email("send-email", async () => {
      return {
        subject: `Offre d'emploi de ${escapeHtml(payload.companyName)} — ${payload.salaryCFA} FCFA/mois`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #27272a; border-radius: 12px; padding: 24px; color: #fafafa; background-color: #09090b;">
            <h2 style="color: #e11d48; margin-top: 0; font-size: 20px;">Nouvelle offre d'emploi</h2>
            <p>Bonjour,</p>
            <p><strong>${escapeHtml(payload.companyName)}</strong> souhaite vous recruter :</p>
            <div style="background: #18181b; border-left: 4px solid #e11d48; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px;">
              <p style="margin: 0 0 8px 0;">Salaire : <strong>${payload.salaryCFA} FCFA / mois</strong></p>
              <p style="margin: 0 0 8px 0;">Type : <strong>${EMPLOYMENT_LABELS[payload.employmentType] ?? escapeHtml(payload.employmentType)}</strong></p>
              ${payload.startDate ? `<p style="margin: 0;">Début souhaité : <strong>${escapeHtml(payload.startDate)}</strong></p>` : ""}
            </div>
            ${payload.note ? `<p style="font-style: italic; color: #a1a1aa;">« ${escapeHtml(payload.note)} »</p>` : ""}
            <p style="font-size: 13px; color: #71717a;">Ouvrez l'application Moja Chauffeur pour accepter, décliner ou négocier.</p>
          </div>
        `,
      };
    });
  },
  {
    name: "Driver Offer Received",
    description:
      "Driver receives a new structured employment offer from an operator",
    payloadSchema: basePayload.extend({
      email: z.string().optional(),
      companyName: z.string(),
      employmentType: z.string(),
      salaryCFA: z.string(),
      startDate: z.string().nullable().optional(),
      expiresAt: z.string(),
      note: z.string().nullable().optional(),
    }),
  },
);

/**
 * Driver — operator countered back on driver's counter-proposal.
 */
export const driverOfferCounteredWorkflow = workflow(
  "driver-offer-countered",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Contre-proposition de l'opérateur",
      body: `${escapeHtml(payload.companyName)} propose désormais ${payload.salaryCFA ?? "—"} FCFA/mois. Consultez la nouvelle offre.`,
      avatar: "https://avatar.vercel.sh/handshake",
      redirect: { url: "/(tabs)/offers", target: "_self" },
    }));
    // Phase 21 (F-NF-05) — tap data: offer-counter.
    await step.push("send-push", async () => ({
      subject: "Contre-proposition de l'opérateur",
      body: `${escapeHtml(payload.companyName)} propose désormais ${payload.salaryCFA ?? "—"} FCFA/mois.`,
      overrides: {
        expo: { data: { type: "offer-counter", offerId: payload.offerId } },
      },
    }));

    await step.email("send-email", async () => {
      return {
        subject: `${escapeHtml(payload.companyName)} a révisé son offre`,
        body: `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;"><h2 style="color:#e11d48;">Contre-proposition reçue</h2><p><strong>${escapeHtml(payload.companyName)}</strong> propose <strong>${payload.salaryCFA ?? "—"} FCFA/mois</strong>.</p>${payload.note ? `<p style="color:#52525b;"><em>« ${escapeHtml(payload.note)} »</em></p>` : ""}<p>Ouvrez l'application pour répondre.</p></div>`,
      };
    });
  },
  {
    name: "Driver Offer Countered By Operator",
    description: "Operator countered back on a driver's counter-proposal",
    payloadSchema: basePayload.extend({
      email: z.string().optional(),
      companyName: z.string(),
      salaryCFA: z.string().optional(),
      startDate: z.string().nullable().optional(),
      note: z.string().nullable().optional(),
    }),
  },
);

/**
 * Driver — counter accepted; affiliation created.
 */
export const driverOfferCounterAcceptedWorkflow = workflow(
  "driver-offer-counter-accepted",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Accord conclu 🎉",
      body: `${escapeHtml(payload.companyName)} a accepté votre contre-proposition (${payload.salaryCFA} FCFA/mois). Votre affiliation est active.`,
      avatar: "https://avatar.vercel.sh/party",
      redirect: { url: "/(tabs)/offers", target: "_self" },
    }));
    await step.email("send-email", async () => {
      return {
        subject: `Accord conclu avec ${escapeHtml(payload.companyName)}`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><h2 style="color:#059669;">Accord conclu</h2><p><strong>${escapeHtml(payload.companyName)}</strong> a accepté votre contre-proposition : <strong>${payload.salaryCFA} FCFA/mois</strong>.${payload.startDate ? ` Début : <strong>${escapeHtml(payload.startDate)}</strong>.` : ""}</p><p>Votre affiliation est désormais active dans l'application.</p></div>`,
      };
    });
  },
  {
    name: "Driver Counter Accepted",
    description:
      "Operator accepted the driver's counter-offer — affiliation created",
    payloadSchema: basePayload.extend({
      email: z.string().optional(),
      companyName: z.string(),
      salaryCFA: z.string(),
      startDate: z.string().nullable().optional(),
      note: z.string().nullable().optional(),
    }),
  },
);

/**
 * Driver — counter declined.
 */
export const driverOfferCounterDeclinedWorkflow = workflow(
  "driver-offer-counter-declined",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Contre-proposition refusée",
      body: `${escapeHtml(payload.companyName)} a décliné votre contre-proposition.${payload.note ? ` Message : ${escapeHtml(payload.note)}` : ""}`,
      avatar: "https://avatar.vercel.sh/cancel",
      redirect: { url: "/(tabs)/offers", target: "_self" },
    }));
    await step.email("send-email", async () => {
      return {
        subject: `${escapeHtml(payload.companyName)} a décliné votre contre-proposition`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><h2 style="color:#dc2626;">Contre-proposition refusée</h2><p><strong>${escapeHtml(payload.companyName)}</strong> n'a pas retenu votre proposition.</p>${payload.note ? `<p style="color:#52525b;"><em>« ${escapeHtml(payload.note)} »</em></p>` : ""}</div>`,
      };
    });
  },
  {
    name: "Driver Counter Declined",
    description: "Operator declined the driver's counter-offer",
    payloadSchema: basePayload.extend({
      email: z.string().optional(),
      companyName: z.string(),
      note: z.string().nullable().optional(),
    }),
  },
);

/**
 * Driver — pending offer withdrawn by operator.
 */
export const driverOfferWithdrawnWorkflow = workflow(
  "driver-offer-withdrawn",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Offre retirée",
      body: `${escapeHtml(payload.companyName)} a retiré son offre d'emploi.`,
      avatar: "https://avatar.vercel.sh/archive",
      redirect: { url: "/(tabs)/offers", target: "_self" },
    }));
    await step.email("send-email", async () => {
      return {
        subject: `Offre retirée par ${escapeHtml(payload.companyName)}`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><p><strong>${escapeHtml(payload.companyName)}</strong> a retiré son offre d'emploi.</p></div>`,
      };
    });
  },
  {
    name: "Driver Offer Withdrawn",
    description: "Operator withdrew a pending employment offer",
    payloadSchema: basePayload.extend({
      email: z.string().optional(),
      companyName: z.string(),
    }),
  },
);

/**
 * Driver — offer expiring within 24h.
 */
export const driverOfferExpiringSoonWorkflow = workflow(
  "driver-offer-expiring-soon",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Offre bientôt expirée",
      body: `L'offre de ${escapeHtml(payload.counterpartyName)} expire dans ${payload.hoursLeft}h. Répondez maintenant.`,
      avatar: "https://avatar.vercel.sh/clock",
      redirect: { url: "/(tabs)/offers", target: "_self" },
    }));
    // Phase 21 (F-NF-05) — tap data: offer-expiring.
    await step.push("send-push", async () => ({
      subject: `⏰ Offre de ${escapeHtml(payload.counterpartyName)} expire bientôt`,
      body: `L'offre expire dans ${payload.hoursLeft} heures. Répondez maintenant.`,
      overrides: {
        expo: { data: { type: "offer-expiring", offerId: payload.offerId } },
      },
    }));

    await step.email("send-email", async () => {
      return {
        subject: `⏰ L'offre de ${escapeHtml(payload.counterpartyName)} expire bientôt`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><p>L'offre d'emploi de <strong>${escapeHtml(payload.counterpartyName)}</strong> expire dans <strong>${payload.hoursLeft} heures</strong>.</p><p>Ouvrez l'application pour répondre avant expiration.</p></div>`,
      };
    });
  },
  {
    name: "Driver Offer Expiring Soon",
    description: "Reminder 24h before an offer expires (driver side)",
    payloadSchema: basePayload.extend({
      email: z.string().optional(),
      counterpartyName: z.string(),
      hoursLeft: z.number().int(),
    }),
  },
);

/**
 * Driver — offer expired unanswered.
 */
export const driverOfferExpiredWorkflow = workflow(
  "driver-offer-expired",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Offre expirée",
      body: `L'offre de ${escapeHtml(payload.counterpartyName)} a expiré sans réponse.`,
      avatar: "https://avatar.vercel.sh/hourglass",
      redirect: { url: "/(tabs)/offers", target: "_self" },
    }));
    // Phase 21 (F-NF-05) — tap data: offer-expired.
    await step.push("send-push", async () => ({
      subject: `Offre de ${escapeHtml(payload.counterpartyName)} expirée`,
      body: `L'offre a expiré sans réponse après 7 jours.`,
      overrides: {
        expo: { data: { type: "offer-expired", offerId: payload.offerId } },
      },
    }));

    await step.email("send-email", async () => {
      return {
        subject: `L'offre de ${escapeHtml(payload.counterpartyName)} a expiré`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><p>L'offre d'emploi de <strong>${escapeHtml(payload.counterpartyName)}</strong> a expiré après 7 jours sans réponse.</p></div>`,
      };
    });
  },
  {
    name: "Driver Offer Expired",
    description: "Offer expired unanswered (driver side)",
    payloadSchema: basePayload.extend({
      email: z.string().optional(),
      counterpartyName: z.string(),
    }),
  },
);
