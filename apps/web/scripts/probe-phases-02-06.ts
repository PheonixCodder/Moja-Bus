/**
 * Phase 02–06 release probes (Gate A checklist repros) — service-level,
 * executed against a REAL Postgres database. Designed for the converged
 * scratch DB (`moja_probe_tmp`); harmless on any empty database seeded by
 * this script's fixed `pb_` ids. NOT for environments holding live data.
 *
 * Run: DATABASE_URL=<scratch> pnpm exec tsx scripts/probe-phases-02-06.ts
 * Exit 0 = all probes passed; exit 1 = at least one failed.
 */
import { driverCheckInPassengerSchema } from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { getPrismaClient } from "@moja/db";
import { DriverCheckInService } from "@/features/driver/services/driver-check-in-service";
import { PaymentService } from "@/features/payments/payment-service";
import { CancellationService } from "@/features/payments/services/cancellation-service";
import { isCreatableRefundChannel } from "@/features/payments/lib/cancellation-policy";
import { convergeDriversAfterRunEnd } from "@/lib/driver-run-state";

const prisma = getPrismaClient();
const APP_ORIGIN = "https://app.mojaride.ci";

type Probe = { id: string; expect: string; run: () => Promise<string> };
const results: Array<{ id: string; ok: boolean; detail: string }> = [];

function expectTrpcCode(fn: () => Promise<unknown>, code: string) {
  return fn().then(
    () => {
      throw new Error(`expected TRPCError ${code}, but call SUCCEEDED`);
    },
    (err: unknown) => {
      if (!(err instanceof TRPCError)) {
        throw new Error(`expected TRPCError ${code}, got: ${String(err)}`);
      }
      if (err.code !== code) {
        throw new Error(
          `expected TRPCError ${code}, got ${err.code}: ${err.message}`,
        );
      }
      return err.message;
    },
  );
}

async function seed(): Promise<void> {
  // Idempotent-ish: fixed pb_ ids; fresh scratch expected. If a row exists we
  // reuse it via catch-and-continue so re-runs don't explode.
  const up = async <T>(p: Promise<T>) => {
    try {
      await p;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/Unique constraint|P2002/.test(msg)) throw e;
    }
  };

  await up(
    prisma.user.create({
      data: {
        id: "pb_user_op",
        email: "pb-op@example.com",
        fullName: "Probe Operator",
        role: "OPERATOR",
      },
    }),
  );
  await up(
    prisma.user.create({
      data: {
        id: "pb_user_drv_a",
        email: "pb-drv-a@example.com",
        fullName: "Driver A",
        role: "TRAVELER",
      },
    }),
  );
  await up(
    prisma.user.create({
      data: {
        id: "pb_user_drv_b",
        email: "pb-drv-b@example.com",
        fullName: "Driver B",
        role: "TRAVELER",
      },
    }),
  );
  await up(
    prisma.user.create({
      data: {
        id: "pb_user_pax_a",
        email: "pb-pax-a@example.com",
        fullName: "Passenger A",
        role: "TRAVELER",
      },
    }),
  );
  await up(
    prisma.user.create({
      data: {
        id: "pb_user_pax_b",
        email: "pb-pax-b@example.com",
        fullName: "Passenger B",
        role: "TRAVELER",
      },
    }),
  );

  await up(
    prisma.company.create({
      data: {
        id: "pb_co",
        name: "Probe Transport",
        slug: "probe-transport",
        email: "ops@probe.example",
        phone: "+2250100000000",
        registrationNumber: "PB-REG-1",
        taxId: "PB-TAX-1",
        estimatedStaffSize: 3,
      },
    }),
  );

  const city = await prisma.city.upsert({
    where: { id: "pb_city" },
    update: {},
    create: {
      id: "pb_city",
      name: "Probe City",
      region: "Probe",
      district: "Probe",
    },
  });
  const mun = await prisma.municipality.upsert({
    where: { id: "pb_mun" },
    update: {},
    create: { id: "pb_mun", name: "Probe Centre", cityId: city.id },
  });
  // "Terminals" are company_location rows (route's origin/destTerminal FKs).
  await prisma.companyLocation.createMany({
    data: [
      {
        id: "pb_term_o",
        companyId: "pb_co",
        name: "Probe Origin",
        addressLine1: "1 Probe St",
        phone: "+2250100000001",
      },
      {
        id: "pb_term_d",
        companyId: "pb_co",
        name: "Probe Dest",
        addressLine1: "2 Probe St",
        phone: "+2250100000002",
      },
    ],
    skipDuplicates: true,
  });
  await up(
    prisma.route.create({
      data: {
        id: "pb_route",
        name: "Probe Line",
        companyId: "pb_co",
        originTerminalId: "pb_term_o",
        destTerminalId: "pb_term_d",
      },
    }),
  );
  await up(
    prisma.schedule.create({
      data: {
        id: "pb_sched",
        companyId: "pb_co",
        routeId: "pb_route",
        departureTime: "08:00",
      },
    }),
  );

  await up(
    prisma.busType.create({ data: { id: "pb_bustype", name: "Probe Coach" } }),
  );
  await up(
    prisma.seatLayoutTemplate.create({
      data: {
        id: "pb_layout",
        name: "Probe Layout",
        busTypeId: "pb_bustype",
        companyId: "pb_co",
        seatClass: "STANDARD",
        rows: 1,
        columns: 4,
        totalSeats: 4,
      } as never,
    }),
  );
  const bus = await prisma.bus.upsert({
    where: { id: "pb_bus" },
    update: {},
    create: {
      id: "pb_bus",
      registrationPlate: "PB-PLATE-1",
      companyId: "pb_co",
      busTypeId: "pb_bustype",
      layoutTemplateId: "pb_layout",
    },
  });

  // SeatType is an enum whose labels we resolve live rather than hard-code.
  const seatTypeEnum = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
    SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'SeatType' ORDER BY enumsortorder`;
  const seatType =
    seatTypeEnum.find((r) => !/DRIVER|EMPTY/i.test(r.enumlabel))?.enumlabel ??
    seatTypeEnum[0]?.enumlabel ??
    "STANDARD";
  await up(
    prisma.seat.create({
      data: {
        id: "pb_seat_a1",
        busId: bus.id,
        label: "A1",
        row: 1,
        col: 1,
        seatType: seatType as never,
        isBookable: true,
      },
    }),
  );

  const departsSoon = new Date(Date.now() - 60 * 60 * 1000);
  await up(
    prisma.trip.create({
      data: {
        id: "pb_trip_main",
        companyId: "pb_co",
        busId: bus.id,
        scheduleId: "pb_sched",
        departureDate: departsSoon,
        totalSeats: 1,
        routeSnapshotJson: {},
        status: "SCHEDULED",
      } as never,
    }),
  );
  await up(
    prisma.tripStop.create({
      data: {
        id: "pb_stop_1",
        tripId: "pb_trip_main",
        terminalId: "pb_term_o",
        stopOrder: 0,
      },
    }),
  );
  await up(
    prisma.tripStop.create({
      data: {
        id: "pb_stop_2",
        tripId: "pb_trip_main",
        terminalId: "pb_term_d",
        stopOrder: 1,
      },
    }),
  );
  await up(
    prisma.trip.create({
      data: {
        id: "pb_trip_departed",
        companyId: "pb_co",
        busId: bus.id,
        scheduleId: "pb_sched",
        departureDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
        totalSeats: 1,
        routeSnapshotJson: {},
        status: "DEPARTED",
      } as never,
    }),
  );

  const future = new Date(Date.now() + 365 * 24 * 3600 * 1000);
  await up(
    prisma.driverProfile.create({
      data: {
        id: "pb_drv_a",
        userId: "pb_user_drv_a",
        licenseNumber: "PB-LIC-A",
        licenseExpiryDate: future,
      },
    }),
  );
  await up(
    prisma.driverProfile.create({
      data: {
        id: "pb_drv_b",
        userId: "pb_user_drv_b",
        licenseNumber: "PB-LIC-B",
        licenseExpiryDate: future,
      },
    }),
  );
  await up(
    prisma.driverCompanyAffiliation.create({
      data: { id: "pb_aff_a", driverProfileId: "pb_drv_a", companyId: "pb_co" },
    }),
  );
  await up(
    prisma.driverCompanyAffiliation.create({
      data: { id: "pb_aff_b", driverProfileId: "pb_drv_b", companyId: "pb_co" },
    }),
  );
  await up(
    prisma.tripDriverAssignment.create({
      data: {
        id: "pb_asg_a",
        tripId: "pb_trip_main",
        driverProfileId: "pb_drv_a",
        role: "PRIMARY",
      },
    }),
  );

  const mkBooking = async (
    id: string,
    tok: string,
    status: string,
    holdGroupId?: string,
  ) =>
    up(
      prisma.booking.create({
        data: {
          id,
          ticketToken: tok,
          bookingReference: id.toUpperCase(),
          tripId: "pb_trip_main",
          companyId: "pb_co",
          seatId: "pb_seat_a1",
          originTripStopId: "pb_stop_1",
          destinationTripStopId: "pb_stop_2",
          boardingStopOrder: 0,
          dropoffStopOrder: 1,
          passengerName: "Probe Passenger",
          passengerPhone: "+2250787654321",
          farePaid: 5000,
          status,
          ...(holdGroupId ? { holdGroupId } : {}),
        } as never,
      }),
    );

  await up(
    prisma.holdGroup.create({
      data: {
        id: "pb_hold_a",
        offerId: "pb_offer_none",
        tripId: "pb_trip_main",
        companyId: "pb_co",
        baseFareXOF: 5000,
        seatCount: 1,
        holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        userId: "pb_user_pax_a",
        status: "ACTIVE",
      } as never,
    }),
  );
  await up(
    prisma.externalPayment.create({
      data: {
        id: "pb_pay_a",
        provider: "PAYSTACK",
        amountXOF: 5000,
        status: "SUCCESS",
        purpose: "CHECKOUT",
        paystackReference: "pb_ref_A",
        holdGroupId: "pb_hold_a",
      } as never,
    }),
  );

  await mkBooking("pb_bk_p02", "pb_tok_p02", "CONFIRMED");
  await mkBooking("pb_bk_p03", "pb_tok_p03", "CONFIRMED");
  await mkBooking("pb_bk_unpaid", "pb_tok_unpaid", "PENDING_PAYMENT");
}

const svcA = new DriverCheckInService(prisma);
const svcB = new DriverCheckInService(prisma);

const PROBES: Probe[] = [
  {
    id: "P02 · scanner reads issued QR (URL-wrapped token)",
    expect: "scan of `${APP_URL}/tickets/{token}` boards the passenger",
    run: async () => {
      // Reset boarding state so the probe always exercises a FRESH gate scan
      // (re-runs would otherwise legitimately hit alreadyBoarded idempotency).
      await prisma.booking.update({
        where: { ticketToken: "pb_tok_p02" },
        data: { boardedAt: null },
      });
      const input = driverCheckInPassengerSchema.parse({
        ticketToken: `${APP_ORIGIN}/tickets/pb_tok_p02`,
        tripId: undefined,
      });
      const r = await svcA.scanCheckIn("pb_drv_a", input);
      if (!r.success || r.alreadyBoarded)
        throw new Error(`unexpected result: ${JSON.stringify(r)}`);
      return `boarded ${r.passengerName} seat ${r.seatNumber} ref ${r.bookingReference}`;
    },
  },
  {
    id: "P03a · cross-tenancy scan blocked",
    expect: "driver B (not assigned to the ticket's trip) → FORBIDDEN",
    run: async () => {
      const msg = await expectTrpcCode(
        () => svcB.scanCheckIn("pb_drv_b", { ticketToken: "pb_tok_p03" }),
        "FORBIDDEN",
      );
      const still = await prisma.booking.findUnique({
        where: { ticketToken: "pb_tok_p03" },
      });
      if (still?.boardedAt)
        throw new Error("booking was mutated despite FORBIDDEN");
      return msg;
    },
  },
  {
    id: "P03b · unpaid ticket unboardable",
    expect: "PENDING_PAYMENT booking → PRECONDITION_FAILED on scan",
    run: async () =>
      expectTrpcCode(
        () => svcA.scanCheckIn("pb_drv_a", { ticketToken: "pb_tok_unpaid" }),
        "PRECONDITION_FAILED",
      ),
  },
  {
    id: "P04 · verifyPayment ownership enforced",
    expect: "user B verifying user A's reference → FORBIDDEN, no mutation",
    run: async () => {
      const before = await prisma.holdGroup.findUnique({
        where: { id: "pb_hold_a" },
        select: { userId: true, status: true },
      });
      const msg = await expectTrpcCode(
        () =>
          new PaymentService(prisma).verifyAndConfirmForUser(
            "pb_ref_A",
            "pb_user_pax_b",
          ),
        "FORBIDDEN",
      );
      const after = await prisma.holdGroup.findUnique({
        where: { id: "pb_hold_a" },
        select: { userId: true, status: true },
      });
      if (
        before?.userId !== after?.userId ||
        before?.status !== after?.status
      ) {
        throw new Error("hold group was mutated despite FORBIDDEN");
      }
      return msg;
    },
  },
  {
    id: "P05 · PAYSTACK refund channel unreachable",
    expect: "channel guard rejects PAYSTACK; WALLET/CASH remain creatable",
    run: async () => {
      if (isCreatableRefundChannel("PAYSTACK"))
        throw new Error("isCreatableRefundChannel accepted PAYSTACK");
      if (
        !isCreatableRefundChannel("WALLET") ||
        !isCreatableRefundChannel("CASH")
      ) {
        throw new Error("WALLET/CASH unexpectedly rejected");
      }
      const msg = await expectTrpcCode(
        () =>
          new CancellationService(prisma).cancelBooking({
            bookingReference: "PB_BK_P03",
            userId: "pb_user_op",
            userRole: "OPERATOR",
            userCompanyId: "pb_co",
            channel: "PAYSTACK" as never,
            reason: "probe: channel must be rejected",
          }),
        "BAD_REQUEST",
      );
      return msg.slice(0, 80);
    },
  },
  {
    id: "P06 · cancelled run does not strand its driver",
    expect:
      "convergeDriversAfterRunEnd clears ON_TRIP/currentTripId; no ghost in live positions",
    run: async () => {
      await prisma.driverProfile.update({
        where: { id: "pb_drv_a" },
        data: {
          status: "ON_TRIP",
          currentTripId: "pb_trip_departed",
          lastLatitude: 5.35,
          lastLongitude: -4.02,
          lastPingAt: new Date(),
        },
      });
      await prisma.$transaction(async (tx) => {
        await convergeDriversAfterRunEnd(tx as never, "pb_trip_departed");
      });
      const drv = await prisma.driverProfile.findUnique({
        where: { id: "pb_drv_a" },
        select: { status: true, currentTripId: true },
      });
      const converged =
        drv?.currentTripId === null &&
        (drv?.status === "AVAILABLE" || drv?.status === "OFFLINE"); // OFFLINE when no open shift — Phase 06 shift-aware post-run status
      if (!converged) {
        throw new Error(`not converged: ${JSON.stringify(drv)}`);
      }
      // Ghost check — same predicate getLivePositions uses (ON_TRIP/ON_DUTY + coords).
      const ghosts = await prisma.driverProfile.count({
        where: {
          id: "pb_drv_a",
          status: { in: ["ON_TRIP", "ON_DUTY"] },
          lastLatitude: { not: null },
        },
      });
      if (ghosts !== 0)
        throw new Error("driver still appears as a live ghost position");
      return "driver AVAILABLE, currentTripId null, zero ghosts";
    },
  },
];

async function main() {
  console.log("Seeding probe graph…");
  await seed();
  console.log(
    `Running ${PROBES.length} probes against ${process.env.DATABASE_URL?.replace(/\/\/[^@]*@/, "//***@")}\n`,
  );
  let failures = 0;
  for (const probe of PROBES) {
    try {
      const detail = await probe.run();
      results.push({ id: probe.id, ok: true, detail });
      console.log(`✅ ${probe.id}\n   └─ ${detail}`);
    } catch (err) {
      failures += 1;
      const detail = err instanceof Error ? err.message : String(err);
      results.push({ id: probe.id, ok: false, detail });
      console.log(`❌ ${probe.id}\n   └─ FAIL: ${detail}`);
    }
  }
  console.log(
    `\n=== ${results.length - failures}/${results.length} probes passed ===`,
  );
  await prisma.$disconnect();
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(async (err: unknown) => {
  console.error(
    "PROBE RUNNER ERROR:",
    err instanceof Error ? (err.stack ?? err.message) : err,
  );
  await prisma.$disconnect();
  process.exit(1);
});
