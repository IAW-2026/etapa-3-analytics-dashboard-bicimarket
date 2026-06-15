# 4.3 — Operations Dashboard

> **Manager Dashboard — UI Design**
>
> Operational monitoring — fulfillment pipeline, seller acceptance, delivery performance, and bottlenecks.

---

## Purpose

Give operations managers real-time visibility into the order fulfillment pipeline, from payment to delivery, with bottleneck identification.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Operations Dashboard                       [7d ▾] [30d ▾] [Cu▾] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Fulfill- │ │ Avg Del  │ │ Pending  │ │ Seller   │               │
│ │ ment Rate│ │ Time     │ │ Shipments│ │ Accept.  │               │
│ │ 87%      │ │ 3.2 days │ │ 25       │ │ 92%      │               │
│ │ ↑2% vs7d │ │ ↓0.3 vs7d│ │ ↑5 vs7d │ │ ↓3% vs7d │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Fulfillment Funnel (All Time)              Backlog by Status        │
│ ┌────────────────────────────────────┐    ┌──────────────────────┐ │
│ │ Paid                               │    │ Status         Count │ │
│ │ ██████████████████████████████ 1245│    │ ─────────────────── │ │
│ │ ↓                                   │    │ Ready for Pickup 12│ │
│ │ Accepted                            │    │ Picked Up         8│ │
│ │ ████████████████████████████   1145│    │ In Transit       25│ │
│ │ ↓                                   │    │ Total Backlog    45│ │
│ │ Shipped                             │    └──────────────────────┘ │
│ │ ███████████████████████████    1090│                             │
│ │ ↓                                   │    Delivery Time Distribution│
│ │ Delivered                           │    ┌──────────────────────┐ │
│ │ ██████████████████████████    1080│    │                      │ │
│ │                                     │    │ [Histogram chart]    │ │
│ │ Drop-off: Paid→Accepted: -8%       │    │                      │ │
│ │           Accepted→Shipped: -5%    │    └──────────────────────┘ │
│ └────────────────────────────────────┘                             │
│                                                                     │
│ Pending Seller Acceptance                   Recent Deliveries      │
│ ┌────────────────────────────────────┐    ┌──────────────────────┐ │
│ │ Seller     Orders  Waiting Since  │    │ Order  Status  Date  │ │
│ │ ───────────────────────────────── │    │ ─────────────────── │ │
│ │ BikeAR     5      Jun 09          │    │ ORD-001 Delivered  ✓│ │
│ │ RodadosXX  4      Jun 08          │    │ ORD-002 In Transit  │ │
│ │ MTB House  3      Jun 10          │    │ ORD-003 Delivered  ✓│ │
│ │ Ciclos OK  2      Jun 10          │    │ ORD-004 Pending     │ │
│ │ BiciSur    1      Jun 09          │    │ ORD-005 Delivered  ✓│ │
│ └────────────────────────────────────┘    └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- Fulfillment rate, average delivery time, pending shipments, seller acceptance rate
- **Data Source**: Shipping + Seller apps

### 2. Fulfillment Funnel
- **Component**: Custom funnel visualization (horizontal bars with connectors)
- **Stages**: Paid → Accepted → Shipped → Delivered
- **Data Source**: Cross-reference payments, sales_orders, shipments
- **Features**: Drop-off percentage at each stage

### 3. Backlog by Status
- **Component**: `Table` or stacked bar
- **Data Source**: Shipments grouped by status (ready_for_pickup, picked_up, in_transit)

### 4. Delivery Time Distribution
- **Component**: `Histogram` chart
- **Data Source**: Shipment delivery times
- **Features**: Show median, p80, p95 lines

### 5. Pending Seller Acceptance
- **Component**: `Table` with alert badges
- **Data Source**: Sales orders where `fulfillment_status = pending`
- **Features**: Time-since-creation column to highlight stale orders
- **Alert**: Orange background if waiting > 24h, red if > 48h

### 6. Recent Deliveries
- **Component**: Condensed `Table` (last 5)
- **Data Source**: `GET /api/v1/shipments` (most recent)

## States

### Loading
- Skeleton for funnel visualization
- Spinner for tables

### Error
- "Operations data unavailable. The Shipping App may be down."
- Show cached data with timestamp warning

### Empty
- "No active shipments. All orders fulfilled!" (rare state)
- "No pending seller orders. All sellers are up to date."
