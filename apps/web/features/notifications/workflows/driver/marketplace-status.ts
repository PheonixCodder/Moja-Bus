import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";

/**
 * Driver — featured in the marketplace by platform admins.
 */
export const driverMarketplaceFeaturedWorkflow = workflow(
  "driver-marketplace-featured",
  async ({ step }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "⭐ Profil mis en avant",
      body: "Félicitations ! Votre profil est désormais mis en avant en tête du marketplace Moja pour tous les opérateurs.",
      avatar: "https://avatar.vercel.sh/star",
      redirect: { url: "/(tabs)/profile", target: "_self" },
    }));
    await step.email("send-email", async () => ({
      subject: "Votre profil est mis en avant sur Moja ⭐",
      body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; border:1px solid #27272a; border-radius:12px; padding:24px; color:#fafafa; background:#09090b;"><h2 style="color:#f59e0b; margin-top:0;">Profil mis en avant ⭐</h2><p>Votre profil chauffeur apparaît désormais <strong>en tête du marketplace</strong> devant tous les opérateurs de la plateforme.</p><p style="font-size:13px;color:#71717a;">Continuez à fournir un excellent service pour conserver cette visibilité.</p></div>`,
    }));
  },
  {
    name: "Driver Marketplace Featured",
    description: "Platform admins featured this driver across the marketplace",
    payloadSchema: z.object({}),
  },
);

/**
 * Driver — marketplace visibility suspended (with reason).
 */
export const driverMarketplaceSuspendedWorkflow = workflow(
  "driver-marketplace-suspended",
  async ({ step, payload }) => {
    await step.inApp("send-in-app", async () => ({
      subject: "Visibilité marketplace suspendue",
      body: `Votre profil n'apparaît plus dans le marketplace. Motif : ${escapeHtml(payload.reason)}. Vos contrats actifs ne sont pas affectés.`,
      avatar: "https://avatar.vercel.sh/warning",
      redirect: { url: "/(tabs)/offers", target: "_self" },
    }));
    await step.email("send-email", async () => ({
      subject: "Suspension de votre visibilité marketplace",
      body: `<div style="font-family: Arial, sans-serif; max-width:480px; margin:0 auto; padding:24px;"><h2 style="color:#dc2626;">Visibilité marketplace suspendue</h2><p>Motif : <strong>${escapeHtml(payload.reason)}</strong></p><p style="color:#52525b;">Vos affiliations et trajets actifs ne sont pas affectés — vous n'êtes simplement plus visible dans la recherche des opérateurs. Contactez le support Moja pour contester.</p></div>`,
    }));
  },
  {
    name: "Driver Marketplace Suspended",
    description: "Admin suspended the driver's marketplace visibility",
    payloadSchema: z.object({
      reason: z.string(),
    }),
  },
);
