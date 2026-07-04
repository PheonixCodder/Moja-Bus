import { getPrismaClient } from "@moja/db";
import {
  addAppCalendarDays,
  buildAppDepartureTimestamp,
  datesMatchCalendarDay,
  getWeekdayKey,
  isOnOrAfterCalendarDay,
  isOnOrBeforeCalendarDay,
  startOfAppCalendarDay,
} from "./timezone.js";

const prisma = getPrismaClient();

export async function generateTripsForSchedule(
  scheduleId: string,
  defaultBusId: string,
  daysCount = 14,
) {
  // Fetch schedule details with route template, calendar, exceptions, and fares
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

  // Fetch the default bus to populate seats
  const bus = await prisma.bus.findUnique({
    where: { id: defaultBusId },
    include: {
      seats: {
        where: { isActive: true },
      },
    },
  });

  if (!bus) {
    throw new Error(`Default bus ${defaultBusId} not found`);
  }

  const { calendar, exceptions, route } = schedule;
  const [hours, minutes] = schedule.departureTime.split(":").map(Number);

  const tripsCreated = [];

  const today = startOfAppCalendarDay(new Date());

  for (let i = 0; i < daysCount; i++) {
    const targetDate = addAppCalendarDays(today, i);

    const weekdayName = getWeekdayKey(targetDate) as keyof typeof calendar;
    const runsOnDay = calendar[weekdayName];
    if (typeof runsOnDay !== "boolean" || !runsOnDay) {
      continue;
    }

    if (!isOnOrAfterCalendarDay(targetDate, calendar.validFrom)) {
      continue;
    }
    if (
      calendar.validUntil &&
      !isOnOrBeforeCalendarDay(targetDate, calendar.validUntil)
    ) {
      continue;
    }

    const exception = exceptions.find((e) =>
      datesMatchCalendarDay(e.date, targetDate),
    );

    if (exception && exception.type === "CANCELLED") {
      continue;
    }

    const departureTimestamp = buildAppDepartureTimestamp(
      targetDate,
      hours,
      minutes,
    );

    // 4. Ensure no duplicate trip is generated
    const existingTrip = await prisma.trip.findFirst({
      where: {
        scheduleId,
        departureDate: departureTimestamp,
      },
    });

    if (existingTrip) {
      continue;
    }

    // 5. Create Trip with snapshot
    const trip = await prisma.$transaction(async (tx) => {
      const createdTrip = await tx.trip.create({
        data: {
          scheduleId,
          companyId: schedule.companyId,
          busId: defaultBusId,
          departureDate: departureTimestamp,
          estimatedArrival: new Date(
            departureTimestamp.getTime() +
              (route.estimatedMinutes ?? 0) * 60000,
          ),
          totalSeats: bus.seats.length,
          status: "SCHEDULED",
          routeSnapshotJson: JSON.stringify(route),
        },
      });

      // Create TripStops waypoints for boarding queries
      const tripStopsData = route.waypoints.map((w) => ({
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

      await tx.tripStop.createMany({
        data: tripStopsData,
      });

      // Create TripSeats
      const tripSeatsData = bus.seats.map((seat) => ({
        tripId: createdTrip.id,
        seatId: seat.id,
        isActive: true,
      }));

      await tx.tripSeat.createMany({
        data: tripSeatsData,
      });

      return createdTrip;
    });

    tripsCreated.push(trip);
  }

  return tripsCreated;
}
