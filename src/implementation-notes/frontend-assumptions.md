# Frontend Assumptions — Manager Analytics Dashboard

This document records assumptions and implementation decisions made during frontend development.

## Mock data vs. Real data

| Assumption | Rationale |
|---|---|
| Mock services return `PaginatedResponse<T>` with `data`, `total`, `page`, `per_page` | Matches API contract in `03-apis.md` pagination conventions |
| All mock IDs use prefixed format (`pay_`, `set_`, `prd_`, `sor_`, `slp_`, `byr_`, `shp_`) | Matches documented ID conventions |
| Commission rate is fixed at 10% for all sellers | Simplifies mock; real app reads from seller config |
| Filter state is stored in Zustand, not URL params | Filters are local to each page; URL params would require more complex sync |
| Refunds are a flat 1% of payment volume | Simplifies mock; real app calculates from actual refunds |

## Real API vs Mock fallback

The dashboard uses the **real Payments API exclusively** for all Payments/Settlements/Refunds/Payouts data
via the server-side proxy route. No mock fallback exists for payment-related endpoints — if the API returns
empty data, the chart shows the empty state ("No hay datos disponibles para este período.").

The following hooks have **no real API endpoint yet** and use mock data directly:

| Hook | Mock Module | Reason |
|---|---|---|
| `useProductMetrics` / `usePrevProductMetrics` | `@/lib/mock/products` | No Seller App admin endpoint |
| `useShipmentMetrics` / `usePrevShipmentMetrics` | `@/lib/mock/shipments` | No Shipping App admin endpoint |
| `useSalesOrderMetrics` / `usePrevSalesOrderMetrics` | `@/lib/mock/sales-orders` | No Seller App admin endpoint |
| `useSellerMetrics` / `usePrevSellerMetrics` | `@/lib/mock/sellers` | No Seller App admin endpoint |

## API response envelope

Every Payments API response is wrapped in `{ data: T }`.

- `proxyFetchData<T>()` unwraps `raw.data` automatically (for metrics / arrays).
- `proxyFetch<PaginatedResponse<T>>()` keeps the envelope (lists need `pagination`).

## Date parsing

The Payments API returns dates in JavaScript `Date.toString()` format with a
truncated timezone: `"Mon Jun 15 2026 00:00:00 GM"`. The `parseDashboardDate()`
function in `payments.ts` strips the invalid ` GM` suffix and re-parses.

Used in `getRevenueByDayOfWeek()` which computes day-of-week buckets from the
timeseries. Points with unparseable dates are skipped.

## UI language

The entire manager dashboard UI is in Spanish (Argentina):

- Sidebar navigation labels
- KPI card labels
- Chart titles and tooltips
- Table headers
- Empty states and error messages
- Alert banners
- AI Copilot chat interface
- All `formatARS()` uses `es-AR` locale

## Trend computation

Trend indicators are computed by comparing each KPI's current period value against
the **previous period of equal length** (same duration, shifted back).

**Utility in `src/lib/trends.ts`:**
- `getPrevFilters(filters)` — returns `{ from, to }` for the previous period.
- `computeTrend(prev, current)` — returns `TrendInfo | null`. Returns `null` whenever
  either period has zero or equal data (prevents false `+100%` indicators).

**Trend rendering in `KpiCard`:**
- `TrendingUp` green (increase is good), or red (increase is bad, e.g. pending settlements).
- `TrendingDown` red (decrease is bad), or green (decrease is good, e.g. delivery time).
- `Minus` gray — not rendered when `computeTrend` returns null.

**10 prev-period hooks** in `use-dashboard-data.ts` fetch previous period data:
`usePrevPaymentMetrics`, `usePrevRevenueTotal`, `usePrevSettlementMetrics`,
`usePrevCommissionTimeSeries`, `usePrevPayoutMetrics`, `usePrevShipmentMetrics`,
`usePrevSalesOrderMetrics`, `usePrevProductMetrics`, `usePrevSellerMetrics`,
`usePrevRevenueBySeller`.

## Bypassed endpoints

Three Payments API endpoints are **bypassed** because they return empty in the real API.
The dashboard derives equivalent data from the `settlements` list endpoint:

| Endpoint | Bypassed since | Derivation |
|---|---|---|
| `settlements/commission/timeseries` | Always returned `[]` | `getCommissionTimeSeries` calls `GET /api/v1/settlements` and buckets by `fee_amount_cents`. |
| `payouts/metrics` | Always returned `0` totals | `getPayoutMetrics` calls `GET /api/v1/settlements` and filters by status. |
| `payouts` | Always returned `[]` | `getPayouts` calls `GET /api/v1/settlements` and maps to `Payout` shape. |

These paths remain in the proxy allowlist for fallback if the Payments API fixes them.

## Buyer App dependency

- Customer Analytics page requires a Buyer App admin endpoint `GET /api/v1/admin/buyers` that does not yet exist.
- The page shows a banner indicating the limitation and only renders Payment Method Usage data from the Payments App.
- KPI cards for total/new/repeat/at-risk buyers show `—` (unavailable).

## AI Copilot

- The AI Copilot page is a static chat UI shell with no mock responses.
- It is ready for `useChat` from `ai/react` (Vercel AI SDK).
- Suggestions are static buttons in Spanish; clicking them fills the input but does not submit.

## Service Architecture

- `src/lib/api/payments.ts` contains **14 functions** that call the server-side proxy.
- Server-side proxy: `src/app/api/internal/analytics/payments/[...slug]/route.ts` (13 allowed paths, 10s timeout).
- `src/lib/trends.ts` contains `getPrevFilters()` and `computeTrend()` for period-over-period comparison.
- `src/lib/mock/*.ts` modules are async service functions — one per domain area.
  They are imported by TanStack Query hooks for domains where no real API endpoint exists yet (products, shipments, sales-orders, sellers).
- The Zustand store (`dashboard-store.ts`) holds date range state.
- Date reactivity: `useDateFilterKey()` subscribes to `from.getTime()` / `to.getTime()` via Zustand selectors so `queryKey` changes trigger refetch.

## UI Components

- All pages reuse existing shadcn components (`Table`, `Alert`, `Sheet`, `Button`, `Input`).
- Analytics-specific primitives (`KpiCard`, `ChartContainer`, `StatusBadge`, etc.) are in `src/components/analytics/`.
- Recharts is the charting library; charts use CSS variables for theming (`var(--color-chart-1)` etc.).

## Page State

- Seller detail is opened via a Sheet (slide-over panel), not a separate page.
- No page supports drill-down navigation beyond the Sheet pattern.
- Date range filtering applies globally via Zustand; individual pages read from the store.

## Known Limitations

1. `settlements` list endpoint (`GET /api/v1/settlements`) requires Seller auth,
   not analytics token — `useRecentSettlements` may fail with 401 if the API
   hasn't been updated to accept the analytics token.
2. Seller names are resolved from a static 8-entry map (`SELLER_NAMES`) until
   the Seller App admin endpoint exists.
3. Revenue by day-of-week is computed client-side from the timeseries endpoint;
   it will show gaps if the timeseries has data gaps or unparseable dates.
4. The proxy route has a 10s timeout per request.
5. Trends return `null` (hidden) when the previous period has no data,
   which is the normal state given limited API data history.
6. "Items/Orden" KPI on Productos page is hardcoded to `"2.3"` — not computed from data.
