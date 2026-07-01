import cron from "node-cron";
import { getPrismaClient } from "@moja/db";
import { generateTripsForSchedule } from "./trip-generator.js";

const HORIZON_DAYS = 14; // how many days ahead to maintain
const REGENERATE_THRESHOLD = 7; // regenerate when horizon drops below this

export function startTripGenerationCron() {
  // 00:05 every day — CI is UTC+0, no DST
  cron.schedule("5 0 * * *", async () => {
    console.log("[trip-cron] Starting daily trip generation...");
    const prisma = getPrismaClient();

    try {
      const schedules = await prisma.schedule.findMany({
        where: { isActive: true },
        include: {
          trips: {
            where: { status: { not: "CANCELLED" } },
            orderBy: { departureDate: "desc" },
            take: 1,
          },
        },
      });

      let totalGenerated = 0;
      for (const schedule of schedules) {
        const lastTrip = schedule.trips[0];

        // Find the most recently used bus or default bus for this schedule
        let busId = lastTrip?.busId;
        if (!busId) {
          // If no trips exist yet, try to find an active bus for this company
          const defaultBus = await prisma.bus.findFirst({
            where: { companyId: schedule.companyId, status: "ACTIVE" },
          });
          if (!defaultBus) continue;
          busId = defaultBus.id;
        }

        // Check if horizon is close enough to need extension
        const horizonDate = lastTrip
          ? new Date(lastTrip.departureDate)
          : new Date();
        const daysRemaining = Math.ceil(
          (horizonDate.getTime() - Date.now()) / 86_400_000,
        );

        if (daysRemaining < REGENERATE_THRESHOLD) {
          try {
            const created = await generateTripsForSchedule(
              schedule.id,
              busId,
              HORIZON_DAYS,
            );
            totalGenerated += created.length;
            if (created.length > 0) {
              console.log(
                `[trip-cron] Schedule ${schedule.id}: +${created.length} trips`,
              );
            }
          } catch (err: any) {
            console.error(
              `[trip-cron] Failed for schedule ${schedule.id}:`,
              err.message,
            );
          }
        }
      }

      console.log(`[trip-cron] Done. Total new trips: ${totalGenerated}`);
    } catch (err: any) {
      console.error("[trip-cron] Error during cron execution:", err.message);
    }
  });

  console.log("[trip-cron] Daily trip generation cron registered (00:05 UTC)");
}
