import { getPrismaClient } from './src';

const prisma = getPrismaClient();

async function main() {
  console.log('Starting zero-offset backfill...');

  const zeroArrivalWaypoints = await prisma.routeWaypoint.findMany({
    where: {
      arrivalOffsetMinutes: 0,
      stopOrder: { gt: 0 },
    },
  });

  const zeroDepartureWaypoints = await prisma.routeWaypoint.findMany({
    where: {
      departureOffsetMinutes: 0,
      stopOrder: { gt: 0 },
    },
  });

  console.log(`Found ${zeroArrivalWaypoints.length} waypoints with 0 arrival offset.`);
  console.log(`Found ${zeroDepartureWaypoints.length} waypoints with 0 departure offset.`);

  let updatedArrival = 0;
  for (const wp of zeroArrivalWaypoints) {
    await prisma.routeWaypoint.update({
      where: { id: wp.id },
      data: { arrivalOffsetMinutes: 1 },
    });
    updatedArrival++;
  }

  let updatedDeparture = 0;
  for (const wp of zeroDepartureWaypoints) {
    await prisma.routeWaypoint.update({
      where: { id: wp.id },
      data: { departureOffsetMinutes: 16 },
    });
    updatedDeparture++;
  }

  console.log(`Successfully updated ${updatedArrival} arrival offsets and ${updatedDeparture} departure offsets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
