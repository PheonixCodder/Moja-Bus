# 07 — Release Checklist

Close this audit folder only when gates pass.

## Gate A — Query parity (staging DB)

- [ ] For a known `companyId`, SQL windowed `GROUP BY status` equals API `statusCounts` after fix.
- [ ] For each status with count &gt; 0, `trips.list({ status })` `total` equals that count (same dates).
- [ ] All badge equals sum of status counts (or documented unfiltered total), and does **not** drop to 0 when opening an empty filtered view that cannot happen after parity — if a status count is N, list must show N.
- [ ] Past-only ARRIVED rows: either invisible on both chip+list (Option A), or visible on both when dates include them.

## Gate B — UI copy & window

- [ ] Filtered empty shows “no trips match” (EN+FR), not “create a schedule”.
- [ ] Unfiltered empty (new company) still shows “No trips yet”.
- [ ] Visible date range label matches server `window` or toolbar dates.
- [ ] Setting To-date includes trips departing later that calendar day (DISP-006).

## Gate C — Regression

- [ ] `driverProfileId` list mode still returns full history (no accidental window).
- [ ] Schedule deep-link `scheduleId` filter still works on list + counts.
- [ ] Manifest BOARDING → ARRIVED same-day: trip appears under Arrived chip and list until window rolls past.
- [ ] `pnpm --filter web typecheck` + targeted trip tests green.

## Sign-off

| Role | Name | Date | Notes |
| :--- | :--- | :--- | :--- |
| Implementer | | | |
| Reviewer | | | |
| Operator QA | | | Re-check prod-like counts |
