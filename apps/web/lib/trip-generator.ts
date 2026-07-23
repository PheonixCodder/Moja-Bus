import { getPrismaClient } from "@moja/db";
import { addAppCalendarDays, startOfAppCalendarDay } from "./timezone";
import { getCandidateDepartureDates } from "./schedule-trip-window";

const prisma = getPrismaClient();

export async function generateTripsForSchedule(
  scheduleId: string,
  busIdOverride?: string | null,
  daysCount = 14,
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      route: {
        include: {
          waypoints: {
            orderBy: { stopOrder: "asc" },
          },
        },
      },
      calendar: true,
      exceptions: true,
    },
  });

  if (!schedule || !schedule.calendar) {
    throw new Error(
      `Schedule ${scheduleId} not found or calendar not configured`,
    );
  }

  if (!schedule.isActive) {
    throw new Error(
      `Schedule ${scheduleId} is inactive — reactivate before generating trips`,
    );
  }

  const busId = busIdOverride ?? schedule.preferredBusId;
  if (!busId) {
    throw new Error(
      `Schedule ${scheduleId} has no preferred bus for trip generation`,
    );
  }

  const bus = await prisma.bus.findFirst({
    where: {
      id: busId,
      companyId: schedule.companyId,
      deletedAt: null,
      status: "ACTIVE",
    },
    include: {
      seats: {
        where: { isActive: true },
      },
    },
  });

  if (!bus) {
    // Preferred bus no longer usable — clear so operators see the health warning
    if (schedule.preferredBusId === busId && !busIdOverride) {
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { preferredBusId: null },
      });
    }
    throw new Error(
      `Bus ${busId} not found, inactive, or not owned by this company`,
    );
  }

  const { calendar, exceptions, route } = schedule;

  const candidates = getCandidateDepartureDates({
    departureTime: schedule.departureTime,
    calendar: {
      monday: calendar.monday,
      tuesday: calendar.tuesday,
      wednesday: calendar.wednesday,
      thursday: calendar.thursday,
      friday: calendar.friday,
      saturday: calendar.saturday,
      sunday: calendar.sunday,
      validFrom: calendar.validFrom,
      validUntil: calendar.validUntil,
    },
    exceptions: exceptions.map((e) => ({
      date: e.date,
      type: e.type,
      overrideDepartureTime: e.overrideDepartureTime,
    })),
    daysCount,
  });

  if (candidates.length === 0) {
    return [];
  }

  const windowStart = startOfAppCalendarDay(new Date());
  const windowEnd = addAppCalendarDays(windowStart, daysCount);

  const existingTrips = await prisma.trip.findMany({
    where: {
      scheduleId,
      departureDate: {
        gte: windowStart,
        lt: windowEnd,
      },
    },
    select: { departureDate: true },
  });
  const existingKeys = new Set(
    existingTrips.map((t) => t.departureDate.toISOString()),
  );

  const tripsCreated = [];

  for (const candidate of candidates) {
    if (existingKeys.has(candidate.departureTimestamp.toISOString())) {
      continue;
    }

    const departureTimestamp = candidate.departureTimestamp;

    try {
      const trip = await prisma.$transaction(async (tx) => {
        const createdTrip = await tx.trip.create({
          data: {
            scheduleId,
            companyId: schedule.companyId,
            busId,
            departureDate: departureTimestamp,
            estimatedArrival: new Date(
              departureTimestamp.getTime() +
                (route.estimatedMinutes ?? 0) * 60000,
            ),
            totalSeats:
              bus.seats.filter(
                (s) =>
                  s.isActive &&
                  s.seatType !== "DRIVER_AREA" &&
                  s.seatType !== "EMPTY_SPACE",
              ).length || bus.seats.length,
            status: "SCHEDULED",
            routeSnapshotJson: { ...route, version: 1 },
          },
        });

        const lastWaypointOrder =
          route.waypoints.length > 0
            ? route.waypoints[route.waypoints.length - 1]!.stopOrder
            : 0;
        const destStopOrder = lastWaypointOrder + 1;

        const originStop = {
          tripId: createdTrip.id,
          terminalId: route.originTerminalId,
          stopOrder: 0,
          scheduledArrival: departureTimestamp,
          scheduledDeparture: departureTimestamp,
          isPickup: true,
          isDropoff: false,
        };

        const waypointStops = route.waypoints.map((w) => ({
          tripId: createdTrip.id,
          terminalId: w.terminalId,
          stopOrder: w.stopOrder,
          scheduledArrival: new Date(
            departureTimestamp.getTime() + w.arrivalOffsetMinutes * 60000,
          ),
          scheduledDeparture: new Date(
            departureTimestamp.getTime() + w.departureOffsetMinutes * 60000,
          ),
          isPickup: w.isPickup,
          isDropoff: w.isDropoff,
        }));

        const destStop = {
          tripId: createdTrip.id,
          terminalId: route.destTerminalId,
          stopOrder: destStopOrder,
          scheduledArrival: new Date(
            departureTimestamp.getTime() +
              (route.estimatedMinutes ?? 0) * 60000,
          ),
          scheduledDeparture: new Date(
            departureTimestamp.getTime() +
              (route.estimatedMinutes ?? 0) * 60000,
          ),
          isPickup: false,
          isDropoff: true,
        };

        await tx.tripStop.createMany({
          data: [originStop, ...waypointStops, destStop],
        });

        await tx.tripSeat.createMany({
          data: bus.seats.map((seat) => ({
            tripId: createdTrip.id,
            seatId: seat.id,
            isActive: true,
          })),
        });

        return createdTrip;
      });

      tripsCreated.push(trip);
      existingKeys.add(departureTimestamp.toISOString());
    } catch (err: unknown) {
      // Concurrent generator race — unique (scheduleId, departureDate)
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (code === "P2002") {
        existingKeys.add(departureTimestamp.toISOString());
        continue;
      }
      throw err;
    }
  }

  return tripsCreated;
}
