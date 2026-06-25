# 3.6 — Customer Metrics

> **Manager Dashboard — Metrics & KPIs**
>
> Detailed specification of customer-related KPIs.

---

## C1 — Total Buyers

**Definition**: Total number of registered buyer profiles.

**Formula**: `COUNT(buyer_profiles)`

**Data Source**: Buyer App — requires `GET /api/v1/admin/buyers` or equivalent endpoint

**Dashboard Widget**: KPI card

**Priority**: P2

**ASSUMPTION**: No batch buyer endpoint is documented. This KPI requires either a new endpoint or manual data export.

---

## C2 — New Buyer Acquisition

**Definition**: Number of new buyer profiles created in a period.

**Formula**: `COUNT(buyer_profiles WHERE created_at IN period)`

**Data Source**: Same as C1

**Dashboard Widget**: KPI card + time-series chart

**Priority**: P2

**ASSUMPTION**: Same data gap as C1.

---

## C3 — Repeat Buyer Rate

**Definition**: Percentage of buyers with more than one order.

**Formula**: `COUNT(buyers with >= 2 payments) / COUNT(buyers with >= 1 payment) * 100`

**Data Source**: Payments grouped by `buyer_profile_id` — requires aggregating payments per buyer

**Dashboard Widget**: Percentage + trend

**Priority**: P2

**Note**: Repeat buyer rate can be approximated from payment data since `buyer_profile_id` is available on each payment. True repeat rate requires order-level data from Buyer App.

---

## C4 — Payment Method Usage

**Definition**: Distribution of payments across available methods.

**Formula**: `COUNT(payments GROUP BY method)`

**Data Source**: `GET /api/v1/payments` — `method` field

**Dashboard Widget**: Donut/bar chart

**Priority**: P1

**Methods** (from documented schema): `credit_card`, `debit_card`, `cash`, `transfer`, `mercadopago`, `wallet`

---

## C5 — New vs Returning Buyers

**Definition**: Breakdown of payments from first-time vs returning buyers.

**Formula**:
- New: `buyer_profile_id` with exactly 1 payment in period
- Returning: `buyer_profile_id` with > 1 payment in period

**Data Source**: Payments grouped by `buyer_profile_id`

**Dashboard Widget**: Stacked bar chart

**Priority**: P2

---

## Customer Analytics Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Customer Analytics              [7d ▾] [30d ▾] [Custom ▾]    │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ Total    │ │ Nuevos   │ │ Reiterac.│ │ Métodos  │          │
│ │ Comprad. │ │ Comprad. │ │ Tasa     │ │ Pago     │          │
│ │ 2,450    │ │ 120      │ │ 34%      │ │ 5        │          │
│ │ —        │ │          │ │          │ │          │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                │
│ New vs Returning Buyers (Last 12 Months)                       │
│ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇█                               │
│ [Stacked bar chart: new (blue) + returning (green)]             │
│                                                                │
│ Payment Method Distribution        Customer Acquisition Trend  │
│ ┌────────────────────────┐        ┌────────────────────────┐  │
│ │ Credit Card  62%      │        │                        │  │
│ │ Mercado Pago 25%      │        │  (requires Buyer App   │  │
│ │ Debit Card    8%      │        │   admin endpoint)       │  │
│ │ Transfer      5%      │        │                        │  │
│ └────────────────────────┘        └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

> **Note**: Most customer metrics are blocked by the absence of a Buyer App admin endpoint. MVP will show only payment method distribution (C4) and approximate repeat rate from payment data (C3).
