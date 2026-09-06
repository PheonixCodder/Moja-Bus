import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approveRequiredOperatorDocuments } from "../approve-required-operator-documents";

describe("approveRequiredOperatorDocuments", () => {
  it("approves only PENDING current required docs and upserts checklist", async () => {
    const calls: Array<{ op: string; args: unknown }> = [];

    const tx = {
      companyDocument: {
        updateMany: async (args: unknown) => {
          calls.push({ op: "updateMany", args });
          return { count: 2 };
        },
      },
      companyVerification: {
        upsert: async (args: unknown) => {
          calls.push({ op: "upsert", args });
          return {};
        },
      },
    };

    const result = await approveRequiredOperatorDocuments(tx as any, {
      companyId: "co_1",
      reviewedById: "admin_1",
      reviewedAt: new Date("2026-09-06T12:00:00.000Z"),
    });

    assert.equal(result.documentsUpdated, 2);
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.op, "updateMany");
    assert.equal(calls[1]?.op, "upsert");

    const updateArgs = calls[0]?.args as {
      where: {
        companyId: string;
        status: string;
        type: { in: string[] };
      };
      data: { status: string; reviewedById: string };
    };
    assert.equal(updateArgs.where.companyId, "co_1");
    assert.equal(updateArgs.where.status, "PENDING");
    assert.deepEqual(updateArgs.where.type.in, [
      "BUSINESS_REGISTRATION_CERTIFICATE",
      "TAX_CLEARANCE_CERTIFICATE",
      "TRANSPORT_OPERATING_PERMIT",
    ]);
    assert.equal(updateArgs.data.status, "APPROVED");
    assert.equal(updateArgs.data.reviewedById, "admin_1");

    const upsertArgs = calls[1]?.args as {
      update: {
        documentsVerified: boolean;
        permitVerified: boolean;
        bankVerified: boolean;
      };
    };
    assert.equal(upsertArgs.update.documentsVerified, true);
    assert.equal(upsertArgs.update.permitVerified, true);
    assert.equal(upsertArgs.update.bankVerified, true);
  });
});
