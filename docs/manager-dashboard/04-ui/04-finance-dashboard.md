# 4.4 — Finance Dashboard

> **Manager Dashboard — UI Design**
>
> Financial oversight — settlements, payouts, commissions, and liability tracking.

---

## Purpose

Give the finance manager a comprehensive view of marketplace financials: commission earned, pending liabilities, payout performance, and reconciliation.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Finance Dashboard                          [7d ▾] [30d ▾] [Cu▾] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Comm.    │ │ Pending  │ │ Payout   │ │ Settlement│               │
│ │ Revenue  │ │ Settle.  │ │ Volume   │ │ Velocity │               │
│ │ ARS 820K │ │ ARS 850K │ │ ARS 7.4M │ │ 4.2 days │               │
│ │ ↑8% vs7d │ │ ⚠️ +15%  │ │ ↑5% vs7d │ │ ↓0.5 vs7d│               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Commission Revenue (Last 12 Months)                                 │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇█                           │    │
│ │ [Area chart — monthly commission]                            │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
│ ┌────────────────────────────┐    ┌────────────────────────────┐   │
│ │ Recent Settlements         │    │ Recent Payouts             │   │
│ │ ────────────────────────── │    │ ────────────────────────── │   │
│ │ ID    Seller    Amt  Status│    │ ID    Date    Amt   Status │   │
│ │ SET-1 BiciSur  ARS  Pending│    │ PAY-1 Jun10  ARS   ✓     │   │
│ │ SET-2 BikeAR   ARS  Paid   │    │ PAY-2 Jun09  ARS   ✓     │   │
│ │ SET-3 Rodados  ARS  Manual │    │ PAY-3 Jun08  ARS   ✗     │   │
│ │ SET-4 Ciclos   ARS  Pending│    │ PAY-4 Jun07  ARS   ✓     │   │
│ │ ...                       │    │ ...                       │   │
│ │ [View All Settlements ▸]  │    │ [View All Payouts ▸]      │   │
│ └────────────────────────────┘    └────────────────────────────┘   │
│                                                                     │
│ Pending Settlement Liability         Settlement Status Breakdown   │
│ ┌────────────────────────────────┐   ┌──────────────────────────┐  │
│ │ ARS 850K due to 12 sellers     │   │ Paid       75% ███████   │  │
│ │                                │   │ Pending    20% ████      │  │
│ │ [Bar chart: liability by seller]│   │ Manual Rev  3% ▏        │  │
│ │                                │   │ Failed      2% ▏        │  │
│ └────────────────────────────────┘   └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- Commission revenue, pending settlements, payout volume, settlement velocity
- **Data Source**: `GET /api/v1/settlements`, `GET /api/v1/payouts`

### 2. Commission Revenue Chart
- **Component**: `AreaChart`
- **Granularity**: Monthly (default), weekly toggle
- **Data Source**: Settlements `fee_amount_cents` aggregated by month

### 3. Recent Settlements Table
- **Component**: `Table` (shadcn)
- **Columns**: Settlement ID, Seller name, Gross amount, Fee, Net, Status
- **Data Source**: `GET /api/v1/settlements` (last 10)
- **Features**: Status badges (paid=green, pending=yellow, manual_review=orange, failed=red)

### 4. Recent Payouts Table
- **Component**: `Table`
- **Columns**: Payout ID, Date, Seller, Amount, Status
- **Data Source**: `GET /api/v1/payouts` (last 10)

### 5. Pending Settlement Liability
- **Component**: Large number + bar chart by seller
- **Data Source**: `GET /api/v1/settlements?status=pending`

### 6. Settlement Status Breakdown
- **Component**: `DonutChart`
- **Data Source**: Settlements grouped by status

## States

### Loading
- Skeleton tables for settlements and payouts
- Placeholder chart

### Error
- "Financial data unavailable. The Payments App may be down."
- Show last known values with "stale data" badge

### Empty
- "No settlements found for this period."
- "No pending settlements. All sellers have been paid."
