# 3.5 — Finance Metrics

> **Manager Dashboard — Metrics & KPIs**
>
> Detailed specification of finance-related KPIs.

---

## F1 — Pending Settlement Value

**Definition**: Total net amount owed to sellers for completed deliveries not yet paid out.

**Formula**: `SUM(net_amount_cents) WHERE status = 'pending'`

**Data Source**: `GET /api/v1/settlements?status=pending`

**Dashboard Widget**: KPI card (large number, usually flagged as attention item)

**Priority**: P0

**Business Value**: Represents a financial liability. Key metric for cash management.

---

## F2 — Settlement Velocity

**Definition**: Average time between settlement creation and payout completion.

**Formula**: `AVG(TIMESTAMPDIFF(DAY, settlement.created_at, payout.completed_at))`

**Data Source**: Settlement `created_at` + Payout `completed_at` (joined via settlement ID or reference)

**Dashboard Widget**: KPI card (days) + trend chart

**Priority**: P1

**Business Value**: Long settlement times are a common seller complaint. Reducing this improves seller satisfaction.

---

## F3 — Payout Volume

**Definition**: Total amount successfully paid out to sellers.

**Formula**: `SUM(payout_attempt.amount_cents WHERE status = 'completed')`

**Data Source**: `GET /api/v1/payouts` — `status`, `amount_cents`

**Dashboard Widget**: KPI card + cumulative chart

**Priority**: P1

---

## F4 — Failed Settlement Rate

**Definition**: Percentage of settlements that encountered issues.

**Formula**: `COUNT(settlements WHERE status IN ('failed', 'manual_review')) / COUNT(*) * 100`

**Data Source**: `GET /api/v1/settlements` — `status`

**Dashboard Widget**: Percentage (red if > 1%)

**Priority**: P1

**Status values**: `pending`, `paid`, `failed`, `manual_review`

---

## F5 — Total Marketplace Revenue

**Definition**: Total commission fees collected (same as R5). Marketplace top-line revenue.

**Formula**: `SUM(settlements.fee_amount_cents) WHERE status = 'paid'`

**Data Source**: `GET /api/v1/settlements`

**Dashboard Widget**: KPI card + time-series chart

**Priority**: P0

---

## Finance Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Finance Dashboard               [7d ▾] [30d ▾] [Custom ▾]    │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ Liquid.  │ │ Comisión │ │ Liquidac.│ │ Pago     │          │
│ │ Pend.    │ │ Ingresos │ │ Velocidad│ │ Volumen  │          │
│ │ ARS 850K │ │ ARS 820K │ │ 4.2 días │ │ ARS 7.4M │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                │
│ Commission Revenue (Last 12 Months)                            │
│ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇█                               │
│ [Area chart showing monthly commission growth]                  │
│                                                                │
│ Settlement Status Breakdown          Settlement Velocity Trend  │
│ ┌────────────────────────┐           ┌────────────────────┐    │
│ │ Paid       75% ███████ │           │ Days to Payout     │    │
│ │ Pending    20% ████    │           │ ██▄▃▅▄▃▆▅▄▅▄▃▃▂    │    │
│ │ Manual Rev  3% ▏       │           │ Target: < 5 days   │    │
│ │ Failed      2% ▏       │           │ ─────────────────  │    │
│ └────────────────────────┘           └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```
