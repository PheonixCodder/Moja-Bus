# 07 — Charts Audit

## Reference

- Examples: `context/services/shadcn/app/(app)/charts`
- Component: `registry/bases/base/ui/chart.tsx` (radix twin is shared Recharts wrapper)

## Moja implementation

| Item | Detail |
|------|--------|
| File | `packages/ui/src/components/ui/chart.tsx` |
| Lines | ~336 vs reference ~333 — near parity |
| Stack | Recharts 3.8.0 (matches reference pin) |
| Exports | `ChartContainer`, `ChartConfig`, tooltip/legend helpers |
| Styling | Inline utilities (not `cn-chart-*`) — SHADCN-002/011 |

## Theme / CSS variables

`@moja/theme/global.css` defines `--chart-1` … `--chart-5` as **hex** and maps them in `@theme inline`. Architecture OK for `var(--chart-1)` / `var(--color-chart-1)`.

## Application usage

| File | Pattern | Issue |
|------|---------|-------|
| `travel-insights-chart.tsx` | `ChartContainer` + `ChartTooltipContent` | Uses `hsl(var(--primary))` — **invalid** with hex tokens (SHADCN-032) |
| `blog-views-chart.tsx` | `ChartContainer`; custom tooltip JSX | Config uses `hsl(var(--chart-1))`; series uses `var(--color-views)` mixed |
| `blog-read-depth-chart.tsx` | `ChartContainer` + `ChartTooltipContent` | Config `hsl(var(--chart-2))` |
| `driver-analytics-charts.tsx` | **Raw** `ResponsiveContainer` | Bypasses Chart* (SHADCN-031); `hsl(var(--*))` |
| `revenue-analytics-chart.tsx` | **Raw** recharts | SHADCN-031 + SHADCN-032 |
| `dashboard-revenue-chart.tsx` | **Raw** recharts | SHADCN-031 |

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| SHADCN-011 | LOW | Wrapper near-reference; may still use inline classes vs `cn-*` |
| SHADCN-012 | INFO | Chart colors intentionally branded — KEEP hex brand values |
| SHADCN-031 | **MEDIUM** | Half of chart UIs bypass `ChartContainer` |
| SHADCN-032 | **HIGH** | `hsl(var(--token))` with hex CSS variables → invalid colors on charts/maps |

## Verdict

**Primitive healthy; application usage mixed.** Do not treat charts as “fully conforming” until SHADCN-031/032 are fixed. Empty/loading states remain app-level concerns.
