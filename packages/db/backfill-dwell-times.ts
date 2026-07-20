import { getPrismaClient } from './src';

const prisma = getPrismaClient();

async function main() {
  console.log('Starting dwell time backfill...');

  const allWaypoints = await prisma.routeWaypoint.findMany();
  const waypointsToUpdate = allWaypoints.filter(
    (wp) => wp.arrivalOffsetMinutes === wp.departureOffsetMinutes
  );

  console.log(`Found ${waypointsToUpdate.length} waypoints to update.`);

  let updatedCount = 0;
  for (const wp of waypointsToUpdate) {
    // Only add dwell time to intermediate stops (not origin/destination)
    // Origin has arrival=0, departure=0 in legacy data, but actually we should just add 15 to all of them,
    // wait, origin is usually not in RouteWaypoint, wait! RouteWaypoint is intermediate stops.
    // Let's just update all where arrival == departure to arrival + 15.
    await prisma.routeWaypoint.update({
      where: { id: wp.id },
      data: {
        departureOffsetMinutes: wp.arrivalOffsetMinutes + 15,
      },
    });
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} waypoints.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
