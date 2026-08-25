import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveNotificationRoute } from "../lib/notification-routes";

/**
 * Phase 34 (F-NF-15) — tap-routing precedence: identifier map wins, stored
 * redirect is same-surface-only fallback, everything else degrades to
 * "stay put" (null). The literal audit defect encoded: taps used to do
 * nothing but mark read.
 */
describe("notification tap routes", () => {
	it("maps offer lifecycle notices to the offers board", () => {
		assert.equal(
			resolveNotificationRoute({ identifier: "driver-offer-received" }),
			"/(tabs)/offers",
		);
	});

	it("maps dispatch notices to the trips tab", () => {
		for (const id of ["driver-trip-assigned", "driver-trip-unassigned", "driver-dispatch-urgent"]) {
			assert.equal(resolveNotificationRoute({ identifier: id }), "/(tabs)/trips");
		}
	});

	it("maps career notices to the passport tab", () => {
		assert.equal(
			resolveNotificationRoute({ identifier: "driver-verification-outcome" }),
			"/(tabs)/profile",
		);
	});

	it("falls back to a stored redirect when it targets THIS app", () => {
		assert.equal(
			resolveNotificationRoute({ redirectUrl: "/(tabs)/trips" }),
			"/(tabs)/trips",
		);
	});

	it("never follows web-ERP redirects on mobile", () => {
		assert.equal(
			resolveNotificationRoute({ redirectUrl: "/dashboard/operator/trips" }),
			null,
		);
	});

	it("unknown identifier with no usable redirect stays put", () => {
		assert.equal(resolveNotificationRoute({ identifier: "not-a-workflow" }), null);
		assert.equal(resolveNotificationRoute({}), null);
	});
});
