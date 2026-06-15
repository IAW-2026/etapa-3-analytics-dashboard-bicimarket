# Frontend Assumptions — Manager Analytics Dashboard

This document records assumptions made during frontend development.

## Mock data vs. Real data

| Assumption | Rationale |
|---|---|
| Mock services return `PaginatedResponse<T>` with `data`, `total`, `page`, `per_page` | Matches API contract in `03-apis.md` pagination conventions |
| All mock IDs use prefixed format (`pay_`, `set_`, `prd_`, `sor_`, `slp_`, `byr_`, `shp_`) | Matches documented ID conventions |
| Commission rate is fixed at 10% for all sellers | Simplifies mock; real app reads from seller config |
| Filter state is stored in Zustand, not URL params | Filters are local to each page; URL params would require more complex sync |
| Refunds are a flat 1% of payment volume | Simplifies mock; real app calculates from actual refunds |

## Buyer App dependency

- Customer Analytics page requires a Buyer App admin endpoint `GET /api/v1/admin/buyers` that does not yet exist.
- The page shows a banner indicating the limitation and only renders Payment Method Usage data from the Payments App mock.
- KPI cards for total/new/repeat/at-risk buyers show `—` (unavailable).

## AI Copilot

- The AI Copilot page is a static chat UI shell with no mock responses.
- It is ready for `useChat` from `ai/react` (Vercel AI SDK).
- Suggestions are static buttons; clicking them fills the input but does not submit.

## Service Architecture

- `src/lib/mock/*.ts` modules are async service functions — one per domain area.
- They are imported by TanStack Query hooks in `use-dashboard-data.ts`.
- To switch to real API: replace the mock service implementation with an HTTP fetch call, keeping the same return type.
- The Zustand store (`dashboard-store.ts`) holds only date range state, not query results.

## UI Components

- All new pages reuse existing shadcn components (`Table`, `Alert`, `Sheet`, `Button`, `Input`).
- Analytics-specific primitives (`KpiCard`, `ChartContainer`, etc.) are in `src/components/analytics/`.
- Recharts is the charting library; charts use CSS variables for theming (`var(--color-chart-1)` etc.).

## Page State

- Seller detail is opened via a Sheet (slide-over panel), not a separate page.
- No page supports drill-down navigation beyond the Sheet pattern.
- Date range filtering applies globally via Zustand; individual pages read from the store.
