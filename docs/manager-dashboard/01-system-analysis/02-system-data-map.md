# 1.2 — System Data Map

> **Manager Dashboard — System Analysis**
>
> A comprehensive map of all data flowing through the BiciMarket ecosystem, identifying metrics, reports, and insights possible with available data.

---

## 1. Data Flow Matrix

### Legend

| Icon | Meaning |
|------|---------|
| ✔️ | Available via documented API |
| ⚠️ | Partial — some fields available, some missing |
| ❌ | Not available in documented endpoints |
| **ASSUMPTION** | Not documented; inferred for dashboard value |

---

### Order Flow

```
Buyer App                          Seller App                   Shipping App                  Payments App
┌─────────────┐                   ┌──────────────┐             ┌───────────────┐              ┌──────────────┐
│ Order        │ ──PATCH status──► │ Sales Order  │             │ Shipment      │              │ Payment      │
│  (items,     │                   │  (per seller) │ ──POST──►  │  (packages)   │              │  (amount)    │
│   groups,    │                   │              │             │               │              │              │
│   totals)    │                   │              │             │ Tracking      │              │ Settlement   │
│              │                   │              │             │  Events ──────┼──POST────────►│  (per seller)│
│              │                   │              │             │               │  delivered    │              │
│              │                   │              │             │ Delivery      │              │ Payout       │
│              │                   │              │             │  Proofs       │              │  (transfer)  │
└─────────────┘                   └──────────────┘             └───────────────┘              └──────────────┘
       │                                 │                            │                             │
       └─────────────── Data for Dashboard ──────────────────────────┘                             │
                                                                                                     │
       ┌────────────────────────────────────────────────────────────────────────────────────────────┘
       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           Manager Dashboard                                       │
│  Aggregates: order data + product data + shipping data + payment data +           │
│              settlement data + refund data + customer data + seller data          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Entity Data Map

### 2.1 Buyer App — Data Available via REST GET

| Endpoint | Returns | Dashboard Value |
|----------|---------|-----------------|
| `GET /api/v1/buyer/orders` | Order list with `id`, `status`, `total_cents`, `created_at`, `seller_groups_count` | Order volume, revenue, trends |
| `GET /api/v1/buyer/orders/{id}` | Full order detail with items, groups, shipping snapshot | Order-level analysis |
| `GET /api/v1/buyer/profile` | Buyer profile | Customer count |
| `GET /api/v1/buyer/favorites` | Favorited products | Product interest proxy |

> **Note**: No documented endpoint exists for listing **all** buyers (admin view) or for buyer analytics aggregation.

### 2.2 Seller App — Data Available via REST GET

| Endpoint | Returns | Dashboard Value |
|----------|---------|-----------------|
| `GET /api/v1/products` | Product list with price, category, status, seller | Catalog size, category distribution |
| `GET /api/v1/seller-profile/me` | Seller profile (individual) | Individual seller data |
| `GET /api/v1/sales-orders` | Sales order list per seller | Fulfillment status per seller |

> **⚠️ No admin endpoint exists** to list all sellers, all products across sellers, or aggregate catalog statistics.

### 2.3 Shipping App — Data Available via REST GET

| Endpoint | Returns | Dashboard Value |
|----------|---------|-----------------|
| `GET /api/v1/shipments?orderId=X` | Shipments for an order | Tracking by order |
| `GET /api/v1/shipments/{id}/tracking-events` | Tracking event history | Delivery timeline |
| `GET /api/v1/shipment-groups/{id}` | Grouped shipments | Multi-seller order tracking |
| `GET /api/v1/logistics-operators` | Operator list | Operational capacity |
| `GET /api/v1/postal-codes` | Postal code geo data | Geographic distribution |

> **⚠️ No endpoint** to list all shipments across all orders (paginated, filtered by date/seller/status).

### 2.4 Payments App — Data Available via REST GET

| Endpoint | Returns | Dashboard Value |
|----------|---------|-----------------|
| `GET /api/v1/payments` | Payment list with filters | Payment volume, success rate, trends |
| `GET /api/v1/payments/{id}` | Payment detail with relations | Single payment analysis |
| `GET /api/v1/settlements` | Settlement list with filters | Commission revenue, pending payments |
| `GET /api/v1/settlements/{id}` | Settlement detail | Single settlement analysis |
| `GET /api/v1/payouts` | Payout list | Payout timing and status |
| `GET /api/v1/payouts/{id}` | Payout detail | Single payout analysis |
| `GET /api/v1/refunds` | Refund list | Refund rate, reason analysis |
| `GET /api/v1/refunds/{id}` | Refund detail | Single refund analysis |
| `GET /api/v1/receipts` | Receipt list | Fiscal compliance |

---

## 3. Metrics Inventory

### 3.1 Directly Available Metrics

These metrics can be computed from data returned by existing GET endpoints without cross-referencing:

| Metric | Source | Endpoint |
|--------|--------|----------|
| Payment count | Payments | `GET /api/v1/payments` |
| Payment volume (sum of amount_cents) | Payments | `GET /api/v1/payments` |
| Payment success rate | Payments | `GET /api/v1/payments` (status filter) |
| Payment method distribution | Payments | `GET /api/v1/payments` (method field) |
| Settlement count | Payments | `GET /api/v1/settlements` |
| Total commissions (sum of fee_amount_cents) | Payments | `GET /api/v1/settlements` |
| Net seller payout (sum of net_amount_cents) | Payments | `GET /api/v1/settlements` |
| Pending settlements count | Payments | `GET /api/v1/settlements` (status=pending) |
| Payout count and volume | Payments | `GET /api/v1/payouts` |
| Refund count and volume | Payments | `GET /api/v1/refunds` |
| Refund rate | Payments | refunds / payments |
| Daily/weekly/monthly payment trends | Payments | `GET /api/v1/payments` (date aggregation) |
| Seller settlement history per seller | Payments | `GET /api/v1/settlements?sellerId=X` |

### 3.2 Cross-Reference Metrics

These require data from two or more apps:

| Metric | Apps Needed | How |
|--------|-------------|-----|
| Average Order Value | Payments + Buyer | `payment.amount_cents` ÷ order count |
| Revenue per Seller | Payments + Seller | `settlement.net_amount_cents` grouped by `seller_profile_id` |
| Commission Rate (effective) | Payments | `fee_amount_cents / gross_amount_cents` per settlement (documented as 10%) |
| Order Fulfillment Rate | Buyer + Shipping | `order.status` vs `shipment.status` for same `order_id` |
| Delivery Time | Shipping + Payments | `delivered_at - created_at` for shipments tied to the same order |
| Seller Payout Time | Payments | `payout.completed_at - settlement.created_at` |
| Product Category Revenue | Seller + Payments | Product category from Seller matched via item snapshots in payment |
| Conversion Funnel | Buyer | Cart → checkout → payment (requires cart abandoned status) |

> **⚠️ Cart `abandoned` status was removed** from the documented schema. Only `active` and `converted` exist. Full funnel analysis is not possible.

### 3.3 Metrics Requiring Assumptions (Not Directly Available)

| Metric | Why Missing | ASSUMPTION |
|--------|-------------|------------|
| Customer Acquisition Rate | No buyer registration date aggregation endpoint | Can be approximated from first order date if available |
| Customer Lifetime Value | No cross-order buyer aggregation endpoint | Would need Buyer App to expose endpoint for orders-by-buyer |
| Cart Abandonment Rate | `abandoned` status removed from schema | Not calculable without this status |
| Product Profitability | No cost data stored | Only revenue-side data available |
| Seller Churn Rate | No seller activity tracking | No documented endpoint for seller activity dates |
| Customer Repeat Purchase Rate | Requires order history per buyer | Not exposed via documented API |
| Geographic Sales Distribution | Address snapshots in orders, but no aggregation endpoint | Could be derived if Buyer App exposes address data |

---

## 4. Report Possibilities

### 4.1 Operational Reports

| Report | Data Source | Feasibility |
|--------|-------------|-------------|
| Daily Sales Report | Payments + Buyer | ✔️ High — aggregate payments by date |
| Settlement Status Report | Payments | ✔️ High — settlements with status filters |
| Payout Reconciliation Report | Payments | ✔️ High — payouts with settlement references |
| Refund Analysis | Payments | ✔️ High — refunds with reason and amount |
| Payment Success/Failure Report | Payments | ✔️ High — payments by status |

### 4.2 Sales Reports

| Report | Data Source | Feasibility |
|--------|-------------|-------------|
| Top Selling Products | Seller + Payments | ⚠️ Medium — needs cross-ref product IDs from snapshots |
| Revenue by Category | Seller + Payments | ⚠️ Medium — needs category data from product IDs |
| Revenue by Seller | Payments | ✔️ High — settlements per seller |
| Revenue Over Time | Payments | ✔️ High — time-series payment data |

### 4.3 Financial Reports

| Report | Data Source | Feasibility |
|--------|-------------|-------------|
| Marketplace GMV | Payments | ✔️ High — sum of all payment amounts |
| Commission Revenue | Payments | ✔️ High — sum of settlement fee amounts |
| Net Revenue After Refunds | Payments | ✔️ High — payments minus refunds |
| Seller Payout Summary | Payments | ✔️ High — payouts aggregated |

### 4.4 Customer Reports

| Report | Data Source | Feasibility |
|--------|-------------|-------------|
| Buyer Registration Trend | Buyer | ❌ Low — no batch buyer endpoint documented |
| Order History by Buyer | Buyer | ❌ Low — no endpoint for "all orders for buyer X" (admin view) |
| Geographic Distribution | Buyer | ❌ Low — address data not aggregated |

### 4.5 Logistics Reports

| Report | Data Source | Feasibility |
|--------|-------------|-------------|
| Delivery Performance (on-time rate) | Shipping | ⚠️ Medium — needs estimated vs actual delivery comparison |
| Shipment Volume by Carrier | Shipping | ⚠️ Medium — no batch shipment endpoint documented |
| Delivery Time by Region | Shipping | ❌ Low — geographic aggregation not exposed |

---

## 5. Insights Possible

### 5.1 Business Insights

| Insight | Data Required | Confidence |
|---------|---------------|------------|
| Which sellers generate most transactions | Settlements by seller | ✔️ High |
| Which payment methods are most used | Payment method field | ✔️ High |
| What is the average marketplace commission | Fee amounts | ✔️ High |
| Which hours/days have most sales | Payment timestamps | ✔️ High |
| Refund rate by reason | Refund reason field | ✔️ High |
| Seller payout velocity | Settlement → payout timing | ✔️ High |
| Payment success rate by method | Payment method + status | ✔️ High |

### 5.2 Strategic Insights

| Insight | Data Required | Confidence |
|---------|---------------|------------|
| Month-over-month GMV growth | Payment time series | ✔️ High |
| Category sales trends | Product category + payment data | ⚠️ Medium |
| Seller retention | Sales order frequency per seller | ❌ Low |
| Customer repeat purchase rate | Order history per buyer | ❌ Low |
| Top products by revenue | Product ID + payment amounts | ⚠️ Medium |

---

## 6. Operational KPIs (Directly Measurable)

| KPI | Formula | Source |
|-----|---------|--------|
| Daily Active Payments | `COUNT(payments WHERE created_at = today)` | Payments |
| Payment Success Rate | `COUNT(status=approved) / COUNT(*)` | Payments |
| Total Transaction Volume | `SUM(amount_cents) WHERE status=approved` | Payments |
| Average Payment Amount | `AVG(amount_cents) WHERE status=approved` | Payments |
| Pending Settlements | `COUNT(settlements WHERE status=pending)` | Payments |
| Settlements in Manual Review | `COUNT(settlements WHERE status=manual_review)` | Payments |
| Refund Rate | `COUNT(refunds WHERE status=approved) / COUNT(payments WHERE status=approved)` | Payments |
| Failed Payouts | `COUNT(payouts WHERE status=failed)` | Payments |
| Average Commission | `AVG(fee_amount_cents / gross_amount_cents)` | Payments |

---

## 7. Strategic KPIs (Requiring Aggregation)

| KPI | Formula | Data Needed |
|-----|---------|-------------|
| Gross Merchandise Volume (GMV) | `SUM(payments.amount_cents WHERE status=approved)` over period | Payments |
| Marketplace Take Rate | `SUM(settlements.fee_amount_cents) / SUM(settlements.gross_amount_cents)` | Payments |
| Settlement Velocity | `AVG(payout.completed_at - settlement.created_at)` in days | Payments |
| Seller Count Growth | `COUNT(seller_profiles created in period)` | Seller (requires endpoint) |
| Buyer Count Growth | `COUNT(buyer_profiles created in period)` | Buyer (requires endpoint) |
| Top Seller Concentration | `TOP 5 sellers' revenue / total revenue` | Payments settlements |
| Order Fulfillment Rate | `COUNT(delivered shipments) / COUNT(total shipments)` | Shipping |

---

## 8. Data Timeliness

| Data | Update Cadence | Freshness for Dashboard |
|------|---------------|------------------------|
| Payments | Real-time (via webhook) | Near real-time |
| Settlements | On delivery (via Shipping notification) | Batch (minutes/hours) |
| Orders | On checkout + payment | Near real-time |
| Shipments | On tracking event | Near real-time |
| Products | On seller update | Cache (≤ 60s) |
| Refunds | On request | Near real-time |

> **Recommendation**: For MVP, use polling with 30-60s intervals for near real-time data. For V2+, consider webhook-style push or a lightweight event relay.
