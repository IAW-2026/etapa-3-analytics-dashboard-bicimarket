# 1.3 — APIs (resumen)

> Resumen para contexto AI. **Las firmas exactas con request/response JSON viven en el proyecto Payments App** — este documento cataloga los endpoints que consume el Manager Dashboard y sus convenciones.

## Convenciones globales

- Verbos: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`. Nada más.
- Base path: `/api/v1/...` para negocio, `/api/internal/...` para server-to-server, `/webhooks/...` para externos (solo Mercado Pago).
- Headers de toda llamada inter-app: `X-Service-Token`, `X-Request-Id`, `Content-Type: application/json`.
- IDs con prefijo: `ord_`, `prd_`, `slp_`, `byp_`, `shp_`, `pay_`, `set_`, `pkg_`, `qte_`, `sor_`, `osg_`.
- Montos en centavos (int), currency `"ARS"`.
- Timestamps en ISO 8601 UTC.

## Analytics Proxy (Manager Dashboard)

El dashboard administrativo expone un Route Handler catch-all para proxear requests a la Payments API.
El proxy vive en `src/app/api/internal/analytics/payments/[...slug]/route.ts` y tiene **13 paths permitidos**.

### Proxy — ALLOWED_PATHS

| Proxy Route (`GET /api/internal/analytics/payments/…`) | Upstream (`GET /api/v1/…`) | Usado por |
|---|---|---|
| `payments/metrics` | `payments/metrics` | `usePaymentMetrics`, `usePrevPaymentMetrics` |
| `payments/revenue/timeseries` | `payments/revenue/timeseries` | `useRevenueTimeSeries`, `usePrevRevenueTotal` |
| `payments/revenue/by-method` | `payments/revenue/by-method` | `useRevenueByMethod` |
| `payments/revenue/by-seller` | `payments/revenue/by-seller` | `useRevenueBySeller`, `usePrevRevenueBySeller` |
| `payments` | `payments` | `useRecentPayments`, `useTopProductsByRevenue` |
| `settlements/metrics` | `settlements/metrics` | `useSettlementMetrics`, `usePrevSettlementMetrics` |
| `settlements/commission/timeseries` | `settlements/commission/timeseries` | ❌ **No usado** (retorna vacío; dashboard computa desde `settlements` list) |
| `settlements/status-breakdown` | `settlements/status-breakdown` | `useSettlementStatusBreakdown` |
| `settlements/pending-by-seller` | `settlements/pending-by-seller` | `usePendingSettlementsBySeller` |
| `settlements` | `settlements` | `useRecentSettlements`, `useCommissionTimeSeries` (derivado), `usePayoutMetrics` (derivado), `useRecentPayouts` (derivado) |
| `refunds/metrics` | `refunds/metrics` | `useRefundMetrics` |
| `payouts/metrics` | `payouts/metrics` | ❌ **No usado** (retorna vacío; dashboard computa desde `settlements` list) |
| `payouts` | `payouts` | ❌ **No usado** (retorna vacío; dashboard computa desde `settlements` list) |

**Auth**: `X-Service-Token: <DASHBOARD_TO_PAYMENTS_SERVICE_TOKEN>` (se inyecta en el Route Handler, nunca se expone al cliente).
**Timeout**: 10s via `AbortSignal.timeout(10_000)`.
**Env vars**: `PAYMENTS_API_URL`, `DASHBOARD_TO_PAYMENTS_SERVICE_TOKEN`.

### Envelope de respuesta

Toda respuesta de la Payments API viene envuelta en `{ data: T }`. El dashboard distingue dos casos:

1. **Métricas y arrays** → `proxyFetchData<T>()` unwrappe `raw.data` y devuelve `T` directamente.
2. **Listas paginadas** → `proxyFetch<PaginatedResponse<T>>()` mantiene el envelope completo (se necesita `data` para items y `pagination` para metadata).

### Endpoints bypassados

Tres endpoints de Payments API están **bypasseados** porque retornan vacío en la API real.
El dashboard deriva datos equivalentes desde la lista de `settlements`:

| Endpoint | Bypass desde | Derivación |
|---|---|---|
| `settlements/commission/timeseries` | Siempre retornó `[]` | `getCommissionTimeSeries` → `GET /api/v1/settlements`, bucketing por `fee_amount_cents` x día |
| `payouts/metrics` | Siempre retornó `0` | `getPayoutMetrics` → `GET /api/v1/settlements`, filtra por status `paid` |
| `payouts` | Siempre retornó `[]` | `getPayouts` → `GET /api/v1/settlements`, mapea a shape `Payout` |

Los paths siguen en `ALLOWED_PATHS` por si la Payments API los corrige.

### Revenue by Day of Week

No tiene endpoint propio. `getRevenueByDayOfWeek()` en `payments.ts` llama al timeseries endpoint
y agrupa localmente por día de la semana usando `parseDashboardDate()`.

## Endpoints by app (catálogo completo)

### 🛒 Buyer App (endpoints de negocio — no usados por el dashboard)
- Perfil: `GET|PUT /api/v1/buyer-profile/me`.
- Direcciones: `GET|POST /api/v1/addresses`, `PUT|DELETE /api/v1/addresses/{id}`.
- Carrito: `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PATCH|DELETE /api/v1/cart/items/{id}`.
- Favoritos: `GET|POST /api/v1/favorites`, `DELETE /api/v1/favorites/{id}`.
- Órdenes: `POST|GET /api/v1/orders`, `GET /api/v1/orders/{id}`, `POST /api/v1/orders/{id}/cancel`.
- Server-to-server: `PATCH /api/v1/orders/{id}/status` (de Payments), `PATCH /api/v1/orders/{id}/seller-groups/{g}/shipping` (de Shipping).

### 🏪 Seller App (endpoints de negocio — no usados por el dashboard)
- Perfil: `GET|PUT /api/v1/seller-profile/me`.
- Server-to-server: `GET /api/v1/seller-profile/{id}/pickup-address`.
- Catálogo: `GET /api/v1/products` (filtros, paginación), `GET /api/v1/products/{id}`, `GET /api/v1/products/{id}/availability`.
- Gestión productos: `POST|PATCH|DELETE /api/v1/products`, `POST|DELETE /api/v1/products/{id}/images`.
- Sub-órdenes: `POST /api/v1/sales-orders` (de Payments), `GET /api/v1/sales-orders`, `GET /api/v1/sales-orders/{id}`, `POST /api/v1/sales-orders/{id}/accept|reject`, `PATCH /api/v1/sales-orders/{id}/prepare`.
- Server-to-server: `PATCH /api/v1/sales-orders/{id}/payment-status`, `PATCH /api/v1/sales-orders/{id}/shipping-status`.
- Inventario: `PATCH /api/v1/products/{id}/stock`, `GET /api/v1/inventory-movements`.

### 🚚 Shipping App (endpoints de negocio — no usados por el dashboard)
- Cotizaciones: `POST /api/v1/shipping-quotes`.
- Envíos: `POST /api/v1/shipments`, `GET /api/v1/shipments/{id}`, `GET /api/v1/shipments?orderId=`, `PATCH /api/v1/shipments/{id}/status`.
- Paquetes: `POST /api/v1/shipments/{id}/packages`.
- Tracking: `POST|GET /api/v1/shipments/{id}/tracking-events`, `POST /api/v1/shipments/{id}/deliver`.
- Operadores: `GET|POST /api/v1/logistics-operators`, `GET /api/v1/my/assignments`, `POST|PATCH /api/v1/shipments/{id}/assignments`.

### 💳 Payments App (endpoints de negocio — no usados por el dashboard)
- Pagos: `POST /api/v1/payments`, `GET /api/v1/payments/{id}`, `GET /api/v1/payments?orderId=`, `PATCH /api/v1/payments/{id}/confirm`, `POST /api/v1/payments/{id}/refund|cancel`.
- Comprobantes: `GET /api/v1/receipts/{id}`.
- Settlements: `POST|GET /api/v1/settlements`, `GET /api/v1/settlements?sellerId=`, `POST /api/v1/payouts`.
- **Único webhook externo**: `POST /webhooks/mercadopago`.
- Server-to-server: `POST /api/v1/internal/shipment-delivered` (de Shipping).

## Patrón de implementación en este template

- **Endpoint público de negocio**: `src/app/api/v1/<recurso>/route.ts`.
- **Endpoint server-to-server**: `src/app/api/internal/<recurso>/route.ts`. Usar `requireServiceToken` de `src/lib/service-auth.ts`. Ejemplo en `src/app/api/internal/ping/route.ts`.
- **Llamada saliente a otra app**: `callServiceApi("seller", "/api/v1/products/...", ...)` de `src/lib/service-auth.ts`.
- **Proxy analytics**: `src/app/api/internal/analytics/payments/[...slug]/route.ts`. No usa `requireServiceToken` porque el token se envía hacia afuera, no se recibe; la autenticación ya la hizo Clerk.
- **Cliente analytics**: `src/lib/api/payments.ts`. **14 funciones** que llaman al proxy, con `proxyFetch` y `proxyFetchData` para manejar el envelope.
- **Trends period-over-period**: `src/lib/trends.ts` con `getPrevFilters()` y `computeTrend()`. **10 hooks prev-period** en `use-dashboard-data.ts`.

## Ver también

- Inventario completo de endpoints que necesita el dashboard: `src/implementation-notes/necessary-endpoints.md`.
- Asunciones de frontend: `src/implementation-notes/frontend-assumptions.md`.
