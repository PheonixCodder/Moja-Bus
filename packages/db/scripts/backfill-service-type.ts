/**
 * Backfill Phase 0+1 of the First-Class Urban design:
 *
 * 1. CompanyLocation.cityId — resolve the legacy free-text `city` string to a
 *    canonical City id (normalized-name match) for locations missing cityId.
 *    After resolution, assign the pass-through municipality when the city has
 *    exactly one municipality and municipalityId is still unset.
 * 2. Route.serviceType — derive INTERCITY/URBAN from origin/dest terminal
 *    cityIds (same city => URBAN). Terminals lacking a cityId default to
 *    INTERCITY (and are reported).
 * 3. Trip.serviceType — snapshot the value from the schedule's route.
 *
 * Idempotent: safe to re-run after partial failures.
 */
import "dotenv/config";
import { getPrismaClient } from "../src";

const prisma = getPrismaClient();

const normalize = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

async function backfillTerminalCities() {
  const cities = await prisma.city.findMany({ where: { isActive: true } });
  const byName = new Map<string, string>();
  for (const c of cities) byName.set(normalize(c.name), c.id);

  const locations = await prisma.companyLocation.findMany({
    where: { cityId: null, city: { not: null } },
    select: { id: true, city: true, cityId: true, municipalityId: true },
  });

  let cityFixed = 0;
  let muniFixed = 0;
  for (const loc of locations) {
    if (!loc.city) continue;
    const cityId = byName.get(normalize(loc.city));
    if (!cityId) continue;

    await prisma.companyLocation.update({
      where: { id: loc.id },
      data: { cityId },
    });
    cityFixed += 1;

    if (!loc.municipalityId) {
      const munis = await prisma.municipality.findMany({
        where: { cityId, isActive: true },
        select: { id: true },
      });
      if (munis.length === 1) {
        await prisma.companyLocation.update({
          where: { id: loc.id },
          data: { municipalityId: munis[0]!.id },
        });
        muniFixed += 1;
      }
    }
  }

  const stillMissing = await prisma.companyLocation.count({
    where: { isTerminal: true, cityId: null },
  });

  console.log(
    `Terminals: resolved cityId for ${cityFixed} location(s), ` +
      `assigned pass-through municipality to ${muniFixed}, ` +
      `${stillMissing} terminal(s) still lack a cityId.`,
  );
  return stillMissing;
}

async function backfillRouteServiceTypes() {
  const routes = await prisma.route.findMany({
    select: {
      id: true,
      name: true,
      originTerminalId: true,
      destTerminalId: true,
    },
  });

  const terminalIds = new Set<string>();
  for (const r of routes) {
    terminalIds.add(r.originTerminalId);
    terminalIds.add(r.destTerminalId);
  }
  const terminals = await prisma.companyLocation.findMany({
    where: { id: { in: [...terminalIds] } },
    select: { id: true, cityId: true },
  });
  const cityByTerminal = new Map(
    terminals.map((t) => [t.id, t.cityId]),
  );

  let urban = 0;
  let intercity = 0;
  let unclassifiable: string[] = [];
  for (const r of routes) {
    const originCity = cityByTerminal.get(r.originTerminalId) ?? null;
    const destCity = cityByTerminal.get(r.destTerminalId) ?? null;
    if (!originCity || !destCity) {
      unclassifiable.push(r.name);
      continue;
    }
    const serviceType = originCity === destCity ? "URBAN" : "INTERCITY";
    await prisma.route.update({
      where: { id: r.id },
      data: { serviceType },
    });
    if (serviceType === "URBAN") urban += 1;
    else intercity += 1;
  }

  console.log(
    `Routes: ${urban} URBAN, ${intercity} INTERCITY, ` +
      `${unclassifiable.length} skipped (terminal missing cityId).`,
  );
  if (unclassifiable.length > 0) {
    console.log("  Skipped (need terminal cityId backfill first):");
    for (const name of unclassifiable) console.log(`    - ${name}`);
  }
}

async function backfillTripServiceTypes() {
  const trips = await prisma.trip.findMany({
    select: {
      id: true,
      schedule: { select: { route: { select: { serviceType: true } } } },
    },
  });

  let updated = 0;
  for (const t of trips) {
    const serviceType = t.schedule?.route?.serviceType ?? "INTERCITY";
    await prisma.trip.update({
      where: { id: t.id },
      data: { serviceType },
    });
    updated += 1;
  }

  console.log(`Trips: snapped serviceType onto ${updated} trip(s).`);
}

async function main() {
  await backfillTerminalCities();
  await backfillRouteServiceTypes();
  await backfillTripServiceTypes();
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
