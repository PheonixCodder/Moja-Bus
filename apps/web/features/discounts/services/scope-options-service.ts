import type { PrismaClient } from "@moja/db";

export async function listSchedulesForScope(
  prisma: PrismaClient,
  input: {
    routeIds: string[];
    companyId?: string | undefined;
    limit: number;
  },
): Promise<Array<{ id: string; name: string; routeId: string }>> {
  const schedules = await prisma.schedule.findMany({
    where: {
      isActive: true,
      ...(input.companyId ? { companyId: input.companyId } : {}),
      ...(input.routeIds.length > 0
        ? { routeId: { in: input.routeIds } }
        : {}),
    },
    orderBy: [{ routeId: "asc" }, { departureTime: "asc" }],
    take: input.limit,
    select: {
      id: true,
      name: true,
      departureTime: true,
      routeId: true,
      route: { select: { name: true } },
    },
  });

  return schedules.map((s) => ({
    id: s.id,
    routeId: s.routeId,
    name: `${s.route.name}${s.name ? ` · ${s.name}` : ""} · ${s.departureTime}`,
  }));
}

export async function listTripsForScope(
  prisma: PrismaClient,
  input: {
    scheduleIds: string[];
    routeIds?: string[] | undefined;
    companyId?: string | undefined;
    daysAhead: number;
    limit: number;
  },
): Promise<Array<{ id: string; name: string; scheduleId: string | null }>> {
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + input.daysAhead);

  let scheduleIds = input.scheduleIds;
  if (scheduleIds.length === 0 && input.routeIds?.length) {
    const schedules = await prisma.schedule.findMany({
      where: {
        isActive: true,
        routeId: { in: input.routeIds },
        ...(input.companyId ? { companyId: input.companyId } : {}),
      },
      select: { id: true },
      take: 200,
    });
    scheduleIds = schedules.map((s) => s.id);
  }

  if (scheduleIds.length === 0 && !input.companyId && !input.routeIds?.length) {
    return [];
  }

  const trips = await prisma.trip.findMany({
    where: {
      archivedAt: null,
      status: { in: ["SCHEDULED", "BOARDING", "IN_TRANSIT"] },
      departureDate: { gte: now, lte: until },
      ...(input.companyId ? { companyId: input.companyId } : {}),
      ...(scheduleIds.length > 0
        ? { scheduleId: { in: scheduleIds } }
        : {}),
    },
    orderBy: { departureDate: "asc" },
    take: input.limit,
    select: {
      id: true,
      scheduleId: true,
      departureDate: true,
      schedule: {
        select: {
          name: true,
          departureTime: true,
          route: { select: { name: true } },
        },
      },
    },
  });

  return trips.map((t) => {
    const when = t.departureDate.toISOString().slice(0, 16).replace("T", " ");
    const routeName = t.schedule?.route.name ?? "Trip";
    const label = t.schedule?.name
      ? `${routeName} · ${t.schedule.name}`
      : routeName;
    return {
      id: t.id,
      scheduleId: t.scheduleId,
      name: `${label} · ${when}`,
    };
  });
}
