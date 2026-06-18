# 3.4 — Operations Metrics

> **Manager Dashboard — Metrics & KPIs**
>
> Detailed specification of operations and logistics KPIs.

---

## OP1 — Fulfillment Rate

**Definition**: Percentage of shipments that reach delivered status.

**Formula**: `COUNT(shipments WHERE status = delivered) / COUNT(shipments) * 100`

**Data Source**: Shipping App `GET /api/v1/shipments` — requires batch endpoint

**Dashboard Widget**: KPI card with gauge visualization

**Priority**: P1

**Note**: Not available without a batch shipment listing endpoint or admin-level access to Shipping App.

---

## OP2 — Average Delivery Time

**Definition**: Average time from shipment creation to delivery confirmation.

**Formula**: `AVG(TIMESTAMPDIFF(HOUR, shipment.created_at, delivery_proof.delivered_at))`

**Data Source**: Shipping App — `shipments.created_at` + `delivery_proofs.delivered_at`

**Dashboard Widget**: KPI card (hours/days) + distribution histogram

**Priority**: P1

---

## OP3 — On-Time Delivery Rate

**Definition**: Percentage of deliveries completed within the estimated timeframe.

**Formula**: `COUNT(delivered WHERE actual_days <= estimated_days_max) / COUNT(delivered) * 100`

**Data Source**: Shipping quotes (estimated_days_max) + shipments (actual delivery date)

**Dashboard Widget**: Percentage + trend

**Priority**: P2

**Note**: Requires matching shipments to their original quotes, which may not be straightforward.

---

## OP4 — Seller Acceptance Rate

**Definition**: Percentage of sales orders accepted by sellers (vs rejected).

**Formula**: `COUNT(sales_orders WHERE fulfillment_status = accepted) / COUNT(sales_orders) * 100`

**Data Source**: Seller App `GET /api/v1/sales-orders` — `fulfillment_status`

**Dashboard Widget**: KPI card + trend chart

**Priority**: P1

**Fulfillment statuses**: `pending`, `accepted`, `rejected`, `preparing`, `ready_for_shipping`, `shipped`, `delivered`

---

## OP5 — Pending Shipments (Backlog)

**Definition**: Number of shipments in the operational pipeline not yet delivered.

**Formula**: `COUNT(shipments WHERE status IN ('ready_for_pickup', 'picked_up', 'in_transit'))`

**Data Source**: Shipping App — requires batch endpoint

**Dashboard Widget**: KPI card + breakdown by status

**Priority**: P1

---

## OP6 — Orders Pending Seller Acceptance

**Definition**: Number of sales orders waiting for seller response.

**Formula**: `COUNT(sales_orders WHERE fulfillment_status = 'pending')`

**Data Source**: Seller App `GET /api/v1/sales-orders`

**Dashboard Widget**: KPI card (alert if > threshold)

**Priority**: P1

---

## Operations Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Operations Dashboard            [7d ▾] [30d ▾] [Custom ▾]    │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ Cumplim. │ │ Prom.    │ │ A Tiempo │ │ Vendedor │          │
│ │ Tasa     │ │ Tiempo   │ │ Tasa     │ │ Aceptac. │          │
│ │ 87%      │ │ 3.2 días │ │ 78%      │ │ 92%      │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                │
│ Fulfillment Funnel                    Backlog by Status        │
│ ┌────────────────────────────┐        ┌────────────────────┐   │
│ │ Paid     → 1,245  (100%)   │        │ Ready for Pickup 12│   │
│ │ Accepted → 1,145  (92%)    │        │ Picked Up         8│   │
│ │ Shipped  → 1,090  (87%)    │        │ In Transit       25│   │
│ │ Delivered → 1,080  (87%)   │        │ Total Backlog    45│   │
│ └────────────────────────────┘        └────────────────────┘   │
│                                                                │
│ Seller Acceptance Rate (Last 30 Days)                          │
│ ████████████████████████████████████░░░░░░░░░░ 92%            │
└─────────────────────────────────────────────────────────────────┘
```
