import { getPrismaClient } from "@moja/db";

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

  // Generate for N days starting from today (UTC+0 CI timezone matches Server time)
  const today = new Date();

  for (let i = 0; i < daysCount; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);

    // 1. Check ServiceCalendar weekday match
    const weekdayMap = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const weekdayName = weekdayMap[
      targetDate.getDay()
    ] as keyof typeof calendar;
    const runsOnDay = calendar[weekdayName];
    if (typeof runsOnDay !== "boolean" || !runsOnDay) {
      continue;
    }

    // 2. Validate calendar bounds
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    if (dateStart < new Date(calendar.validFrom)) {
      continue;
    }
    if (calendar.validUntil && dateStart > new Date(calendar.validUntil)) {
      continue;
    }

    // 3. Check for Exceptions (CANCELLED or MODIFIED)
    const targetDateString = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const exception = exceptions.find(
      (e) => e.date.toISOString().split("T")[0] === targetDateString,
    );

    if (exception && exception.type === "CANCELLED") {
      continue;
    }

    // Determine target departure timestamp
    const departureTimestamp = new Date(
      Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        hours,
        minutes,
        0,
        0,
      ),
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
        status: "AVAILABLE" as any,
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
