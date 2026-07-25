import { workflow } from "@novu/framework";
import { z } from "zod";
import { escapeHtml } from "@/features/notifications/utils/escape-html";


export const operatorBusAssignedWorkflow = workflow(
  "operator-bus-assigned",
  async ({ step, payload }) => {
    // 1. In-App Notification
    await step.inApp("send-in-app", async () => ({
      subject: "Bus Assignment Updated",
      body: `Bus ${escapeHtml(payload.busPlate)} has been assigned to trip to ${escapeHtml(payload.routeName)} departing ${escapeHtml(payload.departureTime)}.`,
      avatar: "https://avatar.vercel.sh/bus",
      redirect: { url: "/dashboard/operator/trips", target: "_self" },
    }));

    // 2. Email Notification
    await step.email("send-email", async () => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #0081F1; margin-top: 0; font-size: 20px; font-weight: bold;">Bus Assignment Updated</h2>
          <p>Hello ${escapeHtml(payload.staffName)},</p>
          <p>You have been assigned to vehicle <strong>${escapeHtml(payload.busPlate)}</strong> for the following route:</p>
          <div style="background: #f8fafc; border-left: 4px solid #0081F1; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Route: <strong>${escapeHtml(payload.routeName)}</strong></p>
            <p style="margin: 0;">Departure: <strong>${escapeHtml(payload.departureTime)}</strong></p>
          </div>
          <p style="font-size: 13px; color: #64748b;">Log in to the operator dashboard to view passenger manifests and trip status.</p>
        </div>
      `;

      return {
        subject: `Bus Assignment: ${escapeHtml(payload.busPlate)} assigned for ${escapeHtml(payload.routeName)}`,
        body: html,
      };
    });
  },
  {
    name: "Operator Bus Assigned",
    description: "Alerts operator staff / drivers when a vehicle is assigned or swapped for a departure",
    payloadSchema: z.object({
      email: z.string().email(),
      staffName: z.string(),
      busPlate: z.string(),
      routeName: z.string(),
      departureTime: z.string(),
      phone: z.string().optional(),
    }),
  }
);
