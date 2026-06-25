# Necessary Backend Endpoints for Analytics Dashboard

The dashboard consumes data from **4 backend apps**: Payments, Seller, Shipping, and Buyer (future).
Payments data flows through a **server-side proxy** (`/api/internal/analytics/payments/[...slug]`).
Shipping data flows through `/api/internal/analytics/shipping/[...slug]` when its upstream endpoints are available.

**Conventions:**
- All endpoints prefixed `/api/v1/...` (public business endpoints) or `/api/internal/...` (server-to-server).
- All list endpoints return `PaginatedResponse<T>` (`{ data: T[], pagination: { page, limit, total, totalPages, hasMore } }`).
- All endpoints accept query params `?from=<ISO>&to=<ISO>&page=N&limit=N`.
- Pagination defaults: page=1, limit=20 unless noted.
- Error format: `{ "error": { "code": "...", "message": "...", "details": {} } }`.

---

## Authentication for Analytics Endpoints

All analytics/metrics endpoints under **Payments App** are gated behind a dedicated service token:

| Consumer | Auth mechanism | Routes |
|---|---|---|
| Analytics App | `X-Service-Token: <DASHBOARD_TO_PAYMENTS_SERVICE_TOKEN>` | All proxy-allowed paths |
| Admin UI (Clerk JWT) | ❌ Rejected on metrics; accepted on list endpoints | N/A |

**Key rules:**
- These metrics endpoints have **no admin JWT fallback**. Only the Analytics App can call them.
- The Analytics App must set `DASHBOARD_TO_PAYMENTS_SERVICE_TOKEN` as an inbound token on the Payments App deployment.
- `GET /api/v1/settlements` and `GET /api/v1/payments` accept the analytics token **in addition to** their existing auth (service token or admin JWT).
- ⚠️ The proxy route sends `X-Service-Token`, not `X-Analytics-Token`. Verify consistency if renamed.

---

## Proxy Route — ALLOWED_PATHS

All payments data goes through a single catch-all proxy at:

```
src/app/api/internal/analytics/payments/[...slug]/route.ts
```

The allowlist currently contains **13 paths**:

| # | Slug | Actually Used? | Hook(s) |
|---|---|---|---|---|
| 1 | `payments/metrics` | ✅ Yes | `usePaymentMetrics`, `usePrevPaymentMetrics` |
| 2 | `payments/revenue/timeseries` | ✅ Yes | `useRevenueTimeSeries`, `usePrevRevenueTotal` |
| 3 | `payments/revenue/by-method` | ✅ Yes | `useRevenueByMethod` |
| 4 | `payments/revenue/by-seller` | ✅ Yes | `useRevenueBySeller`, `usePrevRevenueBySeller` |
| 5 | `payments` | ✅ Yes | `useRecentPayments`, `useTopProductsByRevenue` (via `getPayments`) |
| 6 | `settlements/metrics` | ✅ Yes | `useSettlementMetrics`, `usePrevSettlementMetrics` |
| 7 | `settlements/status-breakdown` | ✅ Yes | `useSettlementStatusBreakdown` |
| 8 | `settlements/pending-by-seller` | ✅ Yes | `usePendingSettlementsBySeller` (also called inside `getSettlementMetrics`) |
| 9 | `settlements` | ✅ Yes | `useCommissionTimeSeries`, `usePayoutMetrics`, `usePayouts`, `useRecentSettlements` |
| 10 | `refunds/metrics` | ✅ Yes | `useRefundMetrics` |

**Proxy details:**
- Send `X-Service-Token` + `X-Request-Id` upstream.
- 10-second timeout via `AbortSignal.timeout(10_000)`.
- Any path not in the allowlist returns `403 FORBIDDEN_PATH`.
- Env vars: `PAYMENTS_API_URL`, `DASHBOARD_TO_PAYMENTS_SERVICE_TOKEN`.

---

## Payments App — Real API (via proxy)

### Payments

| # | Endpoint | Hook(s) | Data Source Notes |
|---|---|---|---|
| P1 | `GET /api/v1/payments/metrics?from=&to=` | `usePaymentMetrics`, `usePrevPaymentMetrics` | Returns `{ total_cents, count, approved_count, avg_order_cents, success_rate }` |
| P2 | `GET /api/v1/payments/revenue/timeseries?from=&to=` | `useRevenueTimeSeries`, `usePrevRevenueTotal` | Daily buckets. Returns `[{ date, value }]`. ⚠️ Date format: `"Mon Jun 15 2026 00:00:00 GM"` — `parseDashboardDate()` strips the trailing ` GM` before parsing. |
| P3 | `GET /api/v1/payments/revenue/by-method?from=&to=` | `useRevenueByMethod` | Returns `[{ method, value, percentage }]`. Methods: `credit_card`, `debit_card`, `mercadopago`, `transfer`, `wallet`. |
| P4 | `GET /api/v1/payments/revenue/by-seller?from=&to=` | `useRevenueBySeller`, `usePrevRevenueBySeller` | Returns `[{ seller_profile_id, revenue_cents }]`. No `seller_name` — resolved via `SELLER_NAMES` static map until Seller App endpoint exists. |
| P5 | `GET /api/v1/payments?from=&to=&page=&limit=` | `useRecentPayments` (limit=5), `useTopProductsByRevenue` (limit=100) | Paginated list. `useTopProductsByRevenue` iterates approved payments and aggregates by `product_id` from `items_summary`. |

### Revenue by Day of Week

| Endpoint | Hook | Status |
|---|---|---|
| `GET /api/v1/payments/revenue/by-day-of-week` | `useRevenueByDayOfWeek` | ⏭️ **Skipped — computed client-side**. `getRevenueByDayOfWeek()` in `payments.ts` calls the timeseries endpoint and buckets locally using `parseDashboardDate()`. |

### Settlements

| # | Endpoint | Hook(s) | Data Source Notes |
|---|---|---|---|
| S1 | `GET /api/v1/settlements/metrics?from=&to=` | `useSettlementMetrics`, `usePrevSettlementMetrics` | Returns `{ total_cents, fee_cents, net_cents, total_count, pending_count, paid_count, failed_count, manual_review_count, avg_velocity_days }`. Combined with `pending-by-seller` to compute `pending_cents`. |
| S3 | `GET /api/v1/settlements/status-breakdown?from=&to=` | `useSettlementStatusBreakdown` | Returns `[{ status, count }]`. Statuses: `pending`, `paid`, `failed`, `manual_review`. |
| S4 | `GET /api/v1/settlements/pending-by-seller?from=&to=` | `usePendingSettlementsBySeller` | Returns `[{ seller_profile_id, pending_count, total_cents }]`. Also called internally by `getSettlementMetrics`. |
| S5 | `GET /api/v1/settlements?from=&to=&status=&page=&limit=` | `useRecentSettlements` (limit=5), `useCommissionTimeSeries`, `usePayoutMetrics`, `useRecentPayouts` | Primary list endpoint. **Derived uses**: `getCommissionTimeSeries` computes daily fee buckets from settlement `fee_amount_cents`; `getPayoutMetrics` derives payout aggregates from settlement list; `getPayouts` maps settlement records to `Payout` shape. |

### Refunds

| # | Endpoint | Hook(s) | Notes |
|---|---|---|---|
| R1 | `GET /api/v1/refunds/metrics?from=&to=` | `useRefundMetrics` | Returns `{ total, approved_count, total_amount_cents, by_reason: [{ reason, count }] }`. Reasons: `seller_rejected`, `buyer_cancelled`, `not_delivered`, `manual`. `by_reason` only includes reasons with approved refunds. |

### Payouts

| # | Endpoint | Hook(s) | Status |
|---|---|---|---|
| X1 | `GET /api/v1/payouts?from=&to=&page=&limit=` | — | ❌ **Not used by dashboard**. Dashboard derives from `GET /api/v1/settlements` list in `getPayouts()`. The endpoint is still served for the admin UI that manages payouts directly. |

---

## Seller App — Mock (no real API yet)

All endpoints below are mocked in `src/lib/mock/` until the Seller App exposes admin endpoints.
The dashboard imports them dynamically in `use-dashboard-data.ts`.

### Products

| # | Endpoint | Mock Hook | Notes |
|---|---|---|---|
| SP1 | `GET /api/v1/products/metrics` | `useProductMetrics`, `usePrevProductMetrics` | No date filter (static). Returns `{ total, categories_count, avg_price_cents, by_category: [{ category, count }], by_condition: [{ condition, count }] }`. Categories: `mtb, road, urban, kids, bmx, parts, accessories, indumentaria`. Conditions: `new, used_like_new, used_good, used_fair`. |

### Sales Orders

| # | Endpoint | Mock Hook | Notes |
|---|---|---|---|
| SO1 | `GET /api/v1/sales-orders/metrics?from=&to=` | `useSalesOrderMetrics`, `usePrevSalesOrderMetrics` | Returns `{ total, pending_count, accepted_count, delivered_count, acceptance_rate, pending_by_seller: [{ seller_profile_id, seller_name, count, oldest_date }] }`. |

### Sellers

| # | Endpoint | Mock Hook | Notes |
|---|---|---|---|
| SSE1 | `GET /api/v1/sellers/metrics` | `useSellerMetrics`, `usePrevSellerMetrics` | No date filter (static). Returns `{ total, verified_count, pending_count, suspended_count, product_count_total }`. |
| SSE2 | `GET /api/v1/sellers` | (internal — `mockData.sellers`) | Used for settlement table and seller detail sheet. |

---

## Shipping App — Real API (via proxy)

### Shipments

| # | Endpoint | Consumer | Notes |
|---|---|---|---|
| SH1 | `GET /api/v1/shipments/metrics?from=&to=` | `useShipmentMetrics`, `usePrevShipmentMetrics` | Returns `{ total, delivered_count, in_transit_count, failed_count, fulfillment_rate, avg_delivery_time_days, backlog_by_status: [{ status, count }] }`. Statuses: `created, ready_for_pickup, picked_up, in_transit, out_for_delivery, delivered, failed_delivery, returned`. |
| SH2 | `GET /api/v1/shipments?from=&to=&status=&page=&limit=` | `shippingApi.getShipments` | Paginated shipment list, available for future dashboard views. |

---

## Buyer App

### Configuración en el Analytics App

El Analytics App necesita dos variables de entorno:

```env
BUYER_API_URL=https://<dominio-del-buyer-app>   # sin trailing slash
DASHBOARD_TO_BUYER_SERVICE_TOKEN=<secreto-compartido>
```

El mismo valor de `DASHBOARD_TO_BUYER_SERVICE_TOKEN` debe estar configurado en el Buyer App. Es el secreto compartido entre ambas apps.

---

### Autenticación (service-to-service)

Todos los requests deben incluir el header:

```
X-Service-Token: <valor de DASHBOARD_TO_BUYER_SERVICE_TOKEN>
Content-Type: application/json
```

**Respuestas de error de auth:**

| Status | `error.code` | Cuándo ocurre |
|---|---|---|
| `401` | `INVALID_SERVICE_TOKEN` | Token ausente o no coincide |
| `500` | `SERVICE_TOKEN_NOT_CONFIGURED` | La env var no está seteada en el Buyer App |

**Formato de error estándar** (todos los endpoints):

```json
{
  "error": {
    "code": "INVALID_SERVICE_TOKEN",
    "message": "Token de servicio inválido o ausente"
  }
}
```

---

### `GET /api/v1/admin/buyers`

Lista paginada de compradores registrados.

**Request**

```
GET {BUYER_API_URL}/api/v1/admin/buyers?from=2025-01-01T00:00:00Z&to=2025-03-31T23:59:59Z&page=1&limit=20
X-Service-Token: ...
```

**Query params**

| Param | Tipo | Default | Límites | Descripción |
|---|---|---|---|---|
| `from` | ISO 8601 | — | — | Filtra compradores cuyo `created_at >= from` |
| `to` | ISO 8601 | — | — | Filtra compradores cuyo `created_at <= to` |
| `page` | int | `1` | mínimo 1 | Número de página |
| `limit` | int | `20` | 1–100 | Tamaño de página |

**Response `200`**

```json
{
  "data": [
    {
      "id": "bprof_...",
      "full_name": "Camila Rojas",
      "email": "camila@example.com",
      "phone": "+5491112345678",
      "created_at": "2025-03-01T12:00:00.000Z",
      "orders_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "total_pages": 8,
    "has_more": true
  }
}
```

**Comportamiento importante:**
- Ordenado por `created_at DESC`.
- `orders_count` cuenta **todas** las órdenes históricas del comprador, **no está filtrado por `from`/`to`**. El filtro de fecha solo afecta qué compradores aparecen en la lista.
- `phone` puede ser `null`.
- `pagination.total` refleja el total de registros que coinciden con el filtro de fecha (no el total global).

---

### `GET /api/v1/admin/buyers/metrics`

Métricas agregadas de compradores.

**Request**

```
GET {BUYER_API_URL}/api/v1/admin/buyers/metrics?from=2025-01-01T00:00:00Z&to=2025-03-31T23:59:59Z
X-Service-Token: ...
```

**Query params**

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `from` | ISO 8601 | — | Inicio del período |
| `to` | ISO 8601 | — | Fin del período |

**Response `200`**

```json
{
  "total": 142,
  "new_this_period": 18,
  "repeat_rate": 34.5,
  "at_risk_count": 7
}
```

**Definición de cada campo:**

| Campo | Tipo | Filtrado por fecha | Descripción |
|---|---|---|---|
| `total` | int | No | Total global de compradores registrados. |
| `new_this_period` | int | Sí (`from`/`to`) | Compradores cuyo `created_at` cae en el rango. Si no se pasan parámetros, devuelve el mismo valor que `total`. |
| `repeat_rate` | float | No | % de compradores con órdenes que tienen ≥ 2 órdenes. Ej: `34.5` = 34.5%. `0` si ningún comprador tiene órdenes. |
| `at_risk_count` | int | No (ventana fija de 90 días desde hoy) | Compradores con ≥ 1 orden histórica pero sin órdenes en los últimos 90 días. |

**Edge cases:**
- `from`/`to` **solo afectan `new_this_period`**. Los otros tres campos son siempre globales, sin importar el rango de fecha enviado.
- `repeat_rate` es `0` cuando ningún comprador tiene órdenes aún.
- `at_risk_count` usa una ventana deslizante de 90 días desde el momento en que se ejecuta la query, no desde `to`.

---

## Seller Name Resolution

Metrics that group by seller (`revenue/by-seller`, `settlements/pending-by-seller`) return `seller_profile_id` only.
The dashboard currently resolves names via a **static 8-entry map** (`SELLER_NAMES` in `use-dashboard-data.ts`):

```ts
const SELLER_NAMES = new Map([
  ["slp_bicisur", "BiciSur"],
  ["slp_bikear", "BikeAR"],
  // ... 6 more
])
```

When the Seller App admin endpoint exists, this should be replaced with:
1. Collect all unique `seller_profile_id` values
2. Call `GET /api/v1/sellers/:id` on Seller App (or batch endpoint)
3. Map `seller_profile_id` → `seller_name` dynamically

---

## Trend Comparison (Prev-Period Hooks)

Every KPI card on every page supports a period-over-period trend indicator.
The comparison is computed by fetching metrics for the **previous period of equal length**
and using `computeTrend()` from `src/lib/trends.ts`.

| Hook | Fetcher | Used On |
|---|---|---|
| `usePrevPaymentMetrics` | `getPaymentMetrics(getPrevFilters(...))` | Panel General (GMV, Órdenes, Tasa de Éxito), Ventas (Ingresos, Órdenes, Ticket Promedio) |
| `usePrevRevenueTotal` | `getRevenueTimeSeries(getPrevFilters(...))` → sum values | Panel General (GMV), Ventas (Crecimiento) |
| `usePrevSettlementMetrics` | `getSettlementMetrics(getPrevFilters(...))` | Panel General (Liquidaciones Pendientes), Finanzas, Vendedores |
| `usePrevCommissionTimeSeries` | `getCommissionTimeSeries(getPrevFilters(...))` → sum values | Finanzas (Comisiones) |
| `usePrevPayoutMetrics` | `getPayoutMetrics(getPrevFilters(...))` | Finanzas (Volumen de Pagos) |
| `usePrevShipmentMetrics` | `getShipmentMetrics(getPrevFilters(...))` (mock) | Operaciones |
| `usePrevSalesOrderMetrics` | `getSalesOrderMetrics(getPrevFilters(...))` (mock) | Operaciones |
| `usePrevProductMetrics` | `getProductMetrics()` (mock, no date filter) | Productos (always flat — static mock) |
| `usePrevSellerMetrics` | `getSellerMetrics()` (mock, no date filter) | Vendedores (always flat — static mock) |
| `usePrevRevenueBySeller` | `getRevenueBySeller(getPrevFilters(...))` | Vendedores (Ingreso Promedio) |

**Utility functions in `src/lib/trends.ts`:**
- `getPrevFilters(filters)` — shifts the date range back by its own duration.
- `computeTrend(prev, current)` — returns `TrendInfo | null`. Returns `null` when either period has zero data (no meaningful comparison), preventing false `+100%` indicators.

The trend renders as:
- Green `TrendingUp` → `+X.X%` (good increase)
- Red `TrendingDown` → `-X.X%` (bad decrease)
- Gray `Minus` → hidden (no comparison data)
- For inverted metrics (pending settlements, delivery time): `positive: false` or `positive: direction === "down"` reverses the color logic.

---

## Endpoint Inventory Summary by App

| App | Endpoints Needed | Status |
|---|---|---|---|
| **Payments** (real, via proxy) | 12 calls across 9 unique endpoints + 1 derived (payouts) | ✅ Most implemented. `payouts` list not called through proxy — dashboard derives from `settlements` list. |
| **Seller** (mock) | 3 (`products/metrics`, `sales-orders/metrics`, `sellers/metrics`) | ⏳ Mocked. No admin endpoints exist yet. |
| **Shipping** (mock) | 1 (`shipments/metrics`) | ⏳ Mocked. No admin endpoint exists yet. |
| **Buyer** (future) | 2 (`admin/buyers`, `admin/buyers/metrics`) | ❌ Not implemented. Customer Analytics shows "requires Buyer App" banner. |

**Total client-side API functions:** 14 `src/lib/api/payments.ts` + 4 mock modules (`shipments`, `sales-orders`, `products`, `sellers`).
**Total proxy-allowed paths:** 10 (in `[...slug]/route.ts` ALLOWED_PATHS).
**Total prev-period hooks:** 10 for trend comparison.
