import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Phase 06 (F-DV-04) — driver run-state convergence helpers.
 * Pure logic + hand-rolled prisma fakes (no DB harness in this repo).
 */
import {
  convergeDriversAfterRunEnd,
  resolvePostRunStatus,
  suspendDriverOperationalState,
} from "../driver-run-state";

type Call = { op: string; args: any };

function makeDb(opts: {
  stranded?: Array<{ id: string }>;
  openShifts?: Array<{ driverProfileId: string }>;
  openShift?: { id: string; startedAt: Date } | null;
}) {
  const calls: Call[] = [];

  const db: any = {
    driverProfile: {
      findMany: async () => opts.stranded ?? [],
      updateMany: async (args: any) => {
        calls.push({ op: "driverProfile.updateMany", args });
        return { count: 0 };
      },
      update: async (args: any) => {
        calls.push({ op: "driverProfile.update", args });
        return {};
      },
    },
    driverShift: {
      findMany: async (args: any) => {
        calls.push({ op: "driverShift.findMany", args });
        return opts.openShifts ?? [];
      },
      findFirst: async (args: any) => {
        calls.push({ op: "driverShift.findFirst", args });
        return opts.openShift ?? null;
      },
      update: async (args: any) => {
        calls.push({ op: "driverShift.update", args });
        return {};
      },
    },
  };

  return { db, calls };
}

describe("resolvePostRunStatus", () => {
  it("keeps on-shift drivers AVAILABLE", () => {
    assert.equal(resolvePostRunStatus(true), "AVAILABLE");
  });

  it("parks off-shift drivers OFFLINE", () => {
    assert.equal(resolvePostRunStatus(false), "OFFLINE");
  });
});

describe("convergeDriversAfterRunEnd", () => {
  it("is a no-op when nobody holds the trip", async () => {
    const { db, calls } = makeDb({});

    const result = await convergeDriversAfterRunEnd(db, "trip_1");

    assert.deepEqual(result, []);
    assert.equal(calls.filter((c) => c.op === "driverProfile.updateMany").length, 0);
  });

  it("groups by shift presence: on-duty → AVAILABLE, off-duty → OFFLINE", async () => {
    const { db, calls } = makeDb({
      stranded: [{ id: "d_on" }, { id: "d_off" }, { id: "d_on2" }],
      openShifts: [{ driverProfileId: "d_on" }, { driverProfileId: "d_on2" }],
    });

    const result = await convergeDriversAfterRunEnd(db, "trip_1");

    assert.deepEqual(result.sort(), ["d_off", "d_on", "d_on2"].sort());

    const updates = calls.filter((c) => c.op === "driverProfile.updateMany");
    assert.equal(updates.length, 2);

    const availableUpdate = updates.find(
      (u) => u.args.data.status === "AVAILABLE",
    );
    const offlineUpdate = updates.find((u) => u.args.data.status === "OFFLINE");

    assert.ok(availableUpdate, "expected an AVAILABLE batch");
    assert.deepEqual(availableUpdate.args.where.id.in.sort(), ["d_on", "d_on2"]);
    assert.equal(availableUpdate.args.where.currentTripId, "trip_1");
    assert.equal(availableUpdate.args.data.currentTripId, null);

    assert.ok(offlineUpdate, "expected an OFFLINE batch");
    assert.deepEqual(offlineUpdate.args.where.id.in, ["d_off"]);
    assert.equal(offlineUpdate.args.data.currentTripId, null);
  });

  it("emits only the AVAILABLE batch when every stranded driver is on duty", async () => {
    const { db, calls } = makeDb({
      stranded: [{ id: "d1" }],
      openShifts: [{ driverProfileId: "d1" }],
    });

    await convergeDriversAfterRunEnd(db, "trip_1");

    const updates = calls.filter((c) => c.op === "driverProfile.updateMany");
    assert.equal(updates.length, 1);
    assert.equal(updates[0]?.args.data.status, "AVAILABLE");
  });
});

describe("suspendDriverOperationalState", () => {
  it("closes the open shift with minute math and clears the run link", async () => {
    const startedAt = new Date(Date.now() - 90 * 60 * 1000);
    const { db, calls } = makeDb({
      openShift: { id: "shift_1", startedAt },
    });

    await suspendDriverOperationalState(db, "d1", "SUSPENDED");

    const shiftClose = calls.find((c) => c.op === "driverShift.update");
    assert.ok(shiftClose, "expected the open shift to be closed");
    assert.equal(shiftClose.args.where.id, "shift_1");
    assert.ok(Math.abs(shiftClose.args.data.totalMinutes - 90) <= 1);
    assert.ok(shiftClose.args.data.endedAt instanceof Date);

    const profileUpdate = calls.find((c) => c.op === "driverProfile.update");
    assert.ok(profileUpdate);
    assert.equal(profileUpdate.args.where.id, "d1");
    assert.equal(profileUpdate.args.data.status, "SUSPENDED");
    assert.equal(profileUpdate.args.data.currentTripId, null);
  });

  it("skips the shift write when nothing is open but still parks the profile", async () => {
    const { db, calls } = makeDb({ openShift: null });

    await suspendDriverOperationalState(db, "d1", "OFFLINE");

    assert.equal(calls.filter((c) => c.op === "driverShift.update").length, 0);

    const profileUpdate = calls.find((c) => c.op === "driverProfile.update");
    assert.ok(profileUpdate);
    assert.equal(profileUpdate.args.data.status, "OFFLINE");
    assert.equal(profileUpdate.args.data.currentTripId, null);
  });
});
