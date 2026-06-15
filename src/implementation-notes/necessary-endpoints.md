# Necessary Backend Endpoints for Analytics Dashboard

All data consumed by the Manager Analytics Dashboard is currently mocked in `src/lib/mock/`. This document lists every endpoint each app must expose for the dashboard to work with real data.

**Conventions:**
- All endpoints prefixed `/api/v1/...` (public business endpoints) or `/api/internal/...` (server-to-server).
- All list endpoints return `PaginatedResponse<T>` (`{ data: T[], pagination: { page, limit, total, totalPages, hasMore } }`).
- All endpoints accept query params `?from=<ISO>&to=<ISO>&page=N&limit=N`.
- Pagination defaults: page=1, limit=20 unless noted.
- Error format: `{ "error": { "code": "...", "message": "...", "details": {} } }`.

---

## Payments App

### Payments

| Endpoint | Hook | Notes |
|---|---|---|
| `GET /api/v1/payments?from=&to=&page=&limit=` | `useTopProductsByRevenue` (via `getPaymentsAll`) | Unpaginated fetch assumed; server should support `limit=10000` or provide a dedicated aggregator |
| `GET /api/v1/payments/metrics?from=&to=` | `usePaymentMetrics` | Returns `{ total_cents, count, approved_count, avg_order_cents, success_rate }` |
| `GET /api/v1/payments/revenue/timeseries?from=&to=` | `useRevenueTimeSeries` | Daily buckets. Returns `[{ date, value }]` in descending order. |
| `GET /api/v1/payments/revenue/by-day-of-week?from=&to=` | `useRevenueByDayOfWeek` | Returns `[{ day: "Monday".."Sunday", value }]`. |
| `GET /api/v1/payments/revenue/by-method?from=&to=` | `useRevenueByMethod` | Returns `[{ method, value, percentage }]`. Methods: `credit_card, debit_card, mercadopago, transfer, wallet`. |
| `GET /api/v1/payments/revenue/by-seller?from=&to=` | `useRevenueBySeller` | Computed from `items_summary[].subtotal_cents + shipping_cost_cents` per seller group. Returns `[{ seller_profile_id, seller_name, revenue_cents }]`. |
| `GET /api/v1/payments/top-products?from=&to=&limit=10` | `useTopProductsByRevenue` | Optional dedicated endpoint. Currently computed client-side from `getPaymentsAll`. Would be more efficient server-side. Returns `[{ product_id, name, revenue, units }]`. |

### Settlements

| Endpoint | Hook | Notes |
|---|---|---|
| `GET /api/v1/settlements?from=&to=&status=&page=&limit=` | `useRecentSettlements` | Status filter optional. Recent uses `limit=5`. |
| `GET /api/v1/settlements/metrics?from=&to=` | `useSettlementMetrics` | Returns `{ total_cents, fee_cents, pending_cents, pending_count, paid_count, failed_count, avg_velocity_days }`. |
| `GET /api/v1/settlements/commission/timeseries?from=&to=` | `useCommissionTimeSeries` | Monthly fee buckets. Returns `[{ date, value }]`. |
| `GET /api/v1/settlements/status-breakdown?from=&to=` | `useSettlementStatusBreakdown` | Returns `[{ status, count }]`. Statuses: `pending, paid, failed, manual_review`. |
| `GET /api/v1/settlements/pending-by-seller?from=&to=` | `usePendingSettlementsBySeller` | Pending settlements grouped by seller. Returns `[{ seller_profile_id, seller_name, total_cents }]`. |

### Refunds

| Endpoint | Hook | Notes |
|---|---|---|
| `GET /api/v1/refunds/metrics?from=&to=` | `useRefundMetrics` | Returns `{ total, approved_count, total_amount_cents, by_reason: [{ reason, count }] }`. Reasons: `seller_rejected, buyer_cancelled, not_delivered, manual`. |

### Payouts

| Endpoint | Hook | Notes |
|---|---|---|
| `GET /api/v1/payouts?from=&to=&page=&limit=` | `useRecentPayouts` | Recent uses `limit=5`. |
| `GET /api/v1/payouts/metrics?from=&to=` | `usePayoutMetrics` | Returns `{ total_cents, count, completed_count, failed_count }`. |

---

## Seller App

### Products

| Endpoint | Hook | Notes |
|---|---|---|
| `GET /api/v1/products?page=&limit=` | (used internally) | Products are mostly static; no date filter used. Limit defaults to 50. |
| `GET /api/v1/products/metrics` | `useProductMetrics` | No date filter. Returns `{ total, categories_count, avg_price_cents, by_category: [{ category, count }], by_condition: [{ condition, count }] }`. Categories: `mtb, road, urban, kids, bmx, parts, accessories, indumentaria`. Conditions: `new, used_like_new, used_good, used_fair`. |

### Sales Orders

| Endpoint | Hook | Notes |
|---|---|---|
| `GET /api/v1/sales-orders?from=&to=&fulfillment_status=&page=&limit=` | (internal) | Status filter optional. |
| `GET /api/v1/sales-orders/metrics?from=&to=` | `useSalesOrderMetrics` | Returns `{ total, pending_count, accepted_count, delivered_count, acceptance_rate, pending_by_seller: [{ seller_profile_id, seller_name, count, oldest_date }] }`. |

### Sellers

| Endpoint | Hook | Notes |
|---|---|---|
| `GET /api/v1/sellers` | (internal) | All seller profiles. Used for settlement table and seller detail sheet. |
| `GET /api/v1/sellers/metrics` | `useSellerMetrics` | No date filter. Returns `{ total, verified_count, pending_count, suspended_count, product_count_total }`. |
| `GET /api/v1/sellers/:id` | (Seller detail) | Individual seller profile with settlements. |

---

## Shipping App

### Shipments

| Endpoint | Hook | Notes |
|---|---|---|
| `GET /api/v1/shipments?from=&to=&status=&page=&limit=` | (internal) | Status filter optional. |
| `GET /api/v1/shipments/metrics?from=&to=` | `useShipmentMetrics` | Returns `{ total, delivered_count, in_transit_count, failed_count, fulfillment_rate, avg_delivery_time_days, backlog_by_status: [{ status, count }] }`. Statuses: `created, ready_for_pickup, picked_up, in_transit, out_for_delivery, delivered, failed_delivery, returned`. |

---

## Buyer App (Future)

### Buyers

| Endpoint | Hook | Notes |
|---|---|---|
| `GET /api/v1/admin/buyers` | None yet | Required for Customer Analytics page. Page currently shows "requires Buyer App endpoint" banners. |
| `GET /api/v1/admin/buyers/metrics` | None yet | Would return `{ total, new_this_period, repeat_rate, at_risk_count }`. |

---

## Endpoint Inventory by App

| App | Endpoints Needed | Priority |
|---|---|---|
| **Payments** | 14 (`/payments`, `/payments/metrics`, `/payments/revenue/*`, `/settlements*`, `/refunds/metrics`, `/payouts*`) | Required for Sales, Finance pages |
| **Seller** | 5 (`/products*`, `/sales-orders*`, `/sellers*`) | Required for Products, Sellers, Operations pages |
| **Shipping** | 2 (`/shipments*`) | Required for Operations page |
| **Buyer** | 2 (`/admin/buyers*`) | Required for Customer Analytics (not yet implemented) |

**Total endpoints:** ~23 REST endpoints across 4 apps.
