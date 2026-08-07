import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_STATUS_CONFIG,
  formatInvitationExpiry,
  formatRelativeTime,
  getAvatarColor,
  getInitials,
} from "@/features/admin/lib/admin-staff";

describe("admin staff — getInitials", () => {
  it("returns two uppercase initials for a multi-word name", () => {
    assert.equal(getInitials("John Doe"), "JD");
    assert.equal(getInitials("John"), "J");
  });

  it("returns fallback for empty or blank names", () => {
    assert.equal(getInitials(null), "?");
    assert.equal(getInitials(undefined), "?");
    assert.equal(getInitials("   "), "?");
  });

  it("handles extra whitespace and mixed case", () => {
    assert.equal(getInitials("  john   oe  "), "JO");
    assert.equal(getInitials("Chinedu Okafor"), "CO");
  });
});

describe("admin staff — getAvatarColor", () => {
  it("returns a stable color for a given name", () => {
    assert.equal(getAvatarColor("Ada Obi"), getAvatarColor("Ada Obi"));
  });

  it("returns a deterministic color for empty input", () => {
    assert.equal(getAvatarColor(""), getAvatarColor(null));
  });

  it("likely returns distinct colors for distinct names", () => {
    const colors = new Set(["Ada", "Bob", "Chidi", "Dike"].map(getAvatarColor));
    assert.ok(colors.size >= 2);
  });
});

describe("admin staff — role and status config", () => {
  it("defines every role label", () => {
    for (const role of [
      "SUPER_ADMIN",
      "ADMIN",
      "OPERATIONS",
      "SUPPORT",
      "COMPLIANCE",
      "FINANCE",
    ] as const) {
      assert.ok(ADMIN_ROLE_LABELS[role].length > 0);
    }
  });

  it("defines every status config", () => {
    for (const status of ["ACTIVE", "INACTIVE", "SUSPENDED"] as const) {
      assert.ok(ADMIN_STATUS_CONFIG[status].label.length > 0);
      assert.ok(ADMIN_STATUS_CONFIG[status].className.length > 0);
    }
  });
});

describe("admin staff — formatRelativeTime", () => {
  it("labels recent activity as just now", () => {
    assert.equal(formatRelativeTime(new Date(Date.now() - 1000)), "Just now");
  });

  it("labels minutes and hours", () => {
    assert.equal(
      formatRelativeTime(new Date(Date.now() - 5 * 60000)),
      "5m ago",
    );
    assert.equal(
      formatRelativeTime(new Date(Date.now() - 3 * 3600000)),
      "3h ago",
    );
    assert.equal(
      formatRelativeTime(new Date(Date.now() - 2 * 86400000)),
      "2d ago",
    );
  });

  it("accepts ISO strings", () => {
    assert.equal(
      formatRelativeTime(new Date(Date.now() - 60000).toISOString()),
      "1m ago",
    );
  });
});

describe("admin staff — formatInvitationExpiry", () => {
  it("marks past dates as expired", () => {
    const result = formatInvitationExpiry(new Date(Date.now() - 1000));
    assert.equal(result.expired, true);
    assert.ok(result.label.startsWith("Expired"));
  });

  it("marks future dates as not expired", () => {
    const result = formatInvitationExpiry(new Date(Date.now() + 5 * 86400000));
    assert.equal(result.expired, false);
    assert.match(result.label, /Expires in \d+ days/);
  });
});
