# 3.2 — Order Metrics

> **Manager Dashboard — Metrics & KPIs**
>
> Detailed specification of order-related KPIs.

---

## O1 — Total Orders

**Definition**: Total number of payments (approved + rejected) in a period. Proxy for order volume since each payment represents one checkout.

**Formula**: `COUNT(payments)` in date range

**Data Source**: `GET /api/v1/payments`

**Dashboard Widget**: KPI card with trend

**Priority**: P0

**Note**: Since each payment maps to one checkout, payment count is the closest available proxy for order count. True order count would require Buyer App order data.

---

## O2 — Orders per Day

**Definition**: Daily breakdown of O1.

**Formula**: `COUNT(payments) WHERE DATE(created_at) = target_date`

**Data Source**: `GET /api/v1/payments`

**Dashboard Widget**: Time-series bar chart

**Priority**: P0

---

## O3 — Multi-Seller Order Rate

**Definition**: Percentage of orders containing products from multiple sellers.

**Formula**: `COUNT(payments WHERE items_summary has > 1 seller group) / COUNT(payments) * 100`

**Data Source**: `GET /api/v1/payments` — `items_summary` is a JSON array; length > 1 indicates multiple sellers

**Dashboard Widget**: Percentage with trend

**Priority**: P2

**Business Value**: Higher multi-seller rates indicate stronger marketplace network effects.

---

## O4 — Payment Success Rate

**Definition**: Percentage of payments that reach approved status.

**Formula**: `COUNT(payments WHERE status = approved) / COUNT(*) * 100`

**Data Source**: `GET /api/v1/payments` — `status`

**Dashboard Widget**: KPI card (percentage + color: green > 90%, yellow > 80%, red < 80%)

**Priority**: P0

**Breakdown**:
- By payment method (which methods have highest success rate)
- By time of day (peak vs off-peak success rates)
- By amount range (small vs large payments)

---

## O5 — Payment Failure Rate by Reason

**Definition**: Breakdown of rejected payments by failure reason.

**Formula**: `COUNT(status = rejected) GROUP BY reason or attempt error_code`

**Data Source**: `GET /api/v1/payments` + `GET /api/v1/payment_attempts`

**Dashboard Widget**: Pie/donut chart of failure reasons + table

**Priority**: P1

**Common failure reasons** (from Mercado Pago integration):
- `rejected_by_bank`
- `insufficient_funds`
- `expired_card`
- `fraud_suspicion`
- `call_for_authorization`
- `buyer_cancelled` (user abandoned MP checkout)

---

## O6 — Refund Rate

**Definition**: Percentage of approved payments that were later refunded.

**Formula**: `COUNT(refunds WHERE status = approved) / COUNT(payments WHERE status = approved) * 100`

**Data Source**: `GET /api/v1/refunds` + `GET /api/v1/payments`

**Dashboard Widget**: KPI card (green < 5%, yellow < 10%, red > 10%)

**Priority**: P0

---

## O7 — Refund Reason Distribution

**Definition**: Breakdown of refunds by reason category.

**Formula**: `COUNT(refunds GROUP BY reason)`

**Data Source**: `GET /api/v1/refunds` — `reason` field

**Dashboard Widget**: Horizontal bar chart of refund reasons

**Priority**: P1

**Reason categories**:
- `seller_rejected`: Seller declined the order after payment
- `buyer_cancelled`: Buyer requested cancellation
- `not_delivered`: Shipment was lost or never delivered
- `manual`: Admin-initiated refund

---

## Order Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Orders Dashboard                [7d ▾] [30d ▾] [Custom ▾]    │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ Órdenes  │ │ Tasa Éx. │ │ Reemb.   │ │ Promedio │          │
│ │ 1,245     │ │ Rate     │ │ Rate     │ │ ARS 52.5K│          │
│ │           │ │ 94.2%   │ │ 2.1%     │ │          │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                │
│ Daily Orders (Last 30 Days)                                    │
│ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇█                               │
│                                                                │
│ Payment Success Rate by Method     Refund Reasons              │
│ ┌────────────────────────────┐     ┌────────────────────────┐  │
│ │ Credit Card     96%       │     │ Buyer Cancelled   45%  │  │
│ │ Mercado Pago    92%       │     │ Seller Rejected   30%  │  │
│ │ Debit Card      88%       │     │ Not Delivered     15%  │  │
│ │ Transfer        85%       │     │ Manual            10%  │  │
│ └────────────────────────────┘     └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```
