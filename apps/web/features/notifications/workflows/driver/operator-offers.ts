import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

const basePayload = z.object({
  offerId: z.string(),
  email: z.string().optional(),
});

const OPERATOR_REDIRECT = { url: "/dashboard/operator/drivers/offers", target: "_self" as const };

/**
 * Operator — driver sent a counter-offer.
 */
export const operatorOfferCounteredWorkflow = workflow(
  "operator-offer-countered",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Contre-offre du chauffeur",
      body: `${escapeHtml(payload.driverName)} propose ${payload.counterSalaryCFA} FCFA/mois${payload.counterStartDate ? ` à partir du ${escapeHtml(payload.counterStartDate)}` : ""}. Répondez sur le tableau des offres.`,
      avatar: "https://avatar.vercel.sh/handshake",
      redirect: OPERATOR_REDIRECT,
    }));
    await step.email("send-email", async () => {
 return {
        subject: `Contre-offre de ${escapeHtml(payload.driverName)} — ${payload.counterSalaryCFA} FCFA/mois`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px; padding:24px; color:#1e293b;"><h2 style="color:#0081F1; margin-top:0;">Contre-offre reçue</h2><p><strong>${escapeHtml(payload.driverName)}</strong> a proposé <strong>${payload.counterSalaryCFA} FCFA/mois</strong>${payload.counterStartDate ? ` avec un début le <strong>${escapeHtml(payload.counterStartDate)}</strong>` : ""}.</p>${payload.note ? `<p style="font-style:italic;color:#64748b;">« ${escapeHtml(payload.note)} »</p>` : ""}<p style="font-size:13px;color:#64748b;">Acceptez, déclinez ou renégociez depuis votre tableau de bord opérateur.</p></div>`,
      };
    });
  },
  {
    name: "Operator Offer Countered",
    description: "Driver countered the operator's employment offer",
    payloadSchema: basePayload.extend({
      driverName: z.string(),
      counterSalaryCFA: z.string(),
      counterStartDate: z.string().nullable().optional(),
      note: z.string().nullable().optional(),
    }),
  }
);

/**
 * Operator — driver accepted the offer (affiliation auto-created).
 */
export const operatorOfferAcceptedWorkflow = workflow(
  "operator-offer-accepted",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Offre acceptée 🎉",
      body: `${escapeHtml(payload.driverName)} a accepté votre offre (${payload.salaryCFA} FCFA/mois, ${escapeHtml(payload.employmentType)}). Il rejoint votre flotte.`,
      avatar: "https://avatar.vercel.sh/party",
      redirect: { url: "/dashboard/operator/drivers", target: "_self" },
    }));
    await step.email("send-email", async () => {
 return {
        subject: `${escapeHtml(payload.driverName)} a accepté votre offre d'emploi`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px; padding:24px; color:#1e293b;"><h2 style="color:#059669; margin-top:0;">Offre acceptée</h2><p><strong>${escapeHtml(payload.driverName)}</strong> a accepté votre offre : <strong>${payload.salaryCFA} FCFA/mois</strong> (${escapeHtml(payload.employmentType)}).</p><p style="font-size:13px;color:#64748b;">Le chauffeur apparaît désormais dans votre liste de chauffeurs. Vous pouvez l'affecter aux trajets.</p></div>`,
      };
    });
  },
  {
    name: "Operator Offer Accepted",
    description: "Driver accepted the employment offer — affiliation created",
    payloadSchema: basePayload.extend({
      driverName: z.string(),
      salaryCFA: z.string(),
      employmentType: z.string(),
    }),
  }
);

/**
 * Operator — driver declined the offer.
 */
export const operatorOfferDeclinedWorkflow = workflow(
  "operator-offer-declined",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Offre déclinée",
      body: `${escapeHtml(payload.driverName)} a décliné votre offre.${payload.note ? ` Message : ${escapeHtml(payload.note)}` : ""}`,
      avatar: "https://avatar.vercel.sh/cancel",
      redirect: OPERATOR_REDIRECT,
    }));
    await step.email("send-email", async () => {
 return {
        subject: `${escapeHtml(payload.driverName)} a décliné votre offre`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><p><strong>${escapeHtml(payload.driverName)}</strong> a décliné votre offre d'emploi.</p>${payload.note ? `<p style="color:#64748b;"><em>« ${escapeHtml(payload.note)} »</em></p>` : ""}</div>`,
      };
    });
  },
  {
    name: "Operator Offer Declined",
    description: "Driver declined the employment offer",
    payloadSchema: basePayload.extend({
      driverName: z.string(),
      note: z.string().nullable().optional(),
    }),
  }
);

/**
 * Operator — offer expiring within 24h without driver response.
 */
export const operatorOfferExpiringSoonWorkflow = workflow(
  "operator-offer-expiring-soon",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Offre bientôt expirée",
      body: `L'offre envoyée à ${escapeHtml(payload.counterpartyName)} expire dans ${payload.hoursLeft}h sans réponse.`,
      avatar: "https://avatar.vercel.sh/clock",
      redirect: OPERATOR_REDIRECT,
    }));
    await step.email("send-email", async () => {
 return {
        subject: `⏰ L'offre à ${escapeHtml(payload.counterpartyName)} expire bientôt`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><p>Votre offre à <strong>${escapeHtml(payload.counterpartyName)}</strong> expire dans <strong>${payload.hoursLeft} heures</strong>.</p></div>`,
      };
    });
  },
  {
    name: "Operator Offer Expiring Soon",
    description: "Reminder 24h before an offer expires (operator side)",
    payloadSchema: basePayload.extend({
      counterpartyName: z.string(),
      hoursLeft: z.number().int(),
    }),
  }
);

/**
 * Operator — offer expired unanswered.
 */
export const operatorOfferExpiredWorkflow = workflow(
  "operator-offer-expired",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Offre expirée",
      body: `L'offre envoyée à ${escapeHtml(payload.counterpartyName)} a expiré après 7 jours.`,
      avatar: "https://avatar.vercel.sh/hourglass",
      redirect: OPERATOR_REDIRECT,
    }));
    await step.email("send-email", async () => {
 return {
        subject: `L'offre à ${escapeHtml(payload.counterpartyName)} a expiré`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><p>Votre offre à <strong>${escapeHtml(payload.counterpartyName)}</strong> a expiré sans réponse après 7 jours.</p></div>`,
      };
    });
  },
  {
    name: "Operator Offer Expired",
    description: "Offer expired unanswered (operator side)",
    payloadSchema: basePayload.extend({
      counterpartyName: z.string(),
    }),
  }
);

/**
 * Operator — one of their exclusive drivers joined another company
 * (auto-terminated by exclusive-conflict rule on marketplace acceptance).
 */
export const driverAffiliationEndedWorkflow = workflow(
  "driver-affiliation-ended",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Fin de contrat exclusif",
      body: `${escapeHtml(payload.driverName)} a rejoint ${escapeHtml(payload.newCompanyName)} et n'est plus disponible en exclusivité.`,
      avatar: "https://avatar.vercel.sh/logout",
      redirect: { url: "/dashboard/operator/drivers", target: "_self" },
    }));
    await step.email("send-email", async () => {
 return {
        subject: `Contrat exclusif terminé — ${escapeHtml(payload.driverName)}`,
        body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><h2 style="color:#dc2626;">Fin de contrat exclusif</h2><p><strong>${escapeHtml(payload.driverName)}</strong> a accepté un contrat exclusif auprès de <strong>${escapeHtml(payload.newCompanyName)}</strong>. Son affiliation exclusive chez vous est terminée conformément à la règle « un seul contrat intercity exclusif actif ».</p></div>`,
      };
    });
  },
  {
    name: "Driver Affiliation Ended",
    description: "Exclusive affiliation auto-terminated because the driver accepted an exclusive offer elsewhere",
    payloadSchema: basePayload.extend({
      driverName: z.string(),
      newCompanyName: z.string(),
    }),
  }
);
