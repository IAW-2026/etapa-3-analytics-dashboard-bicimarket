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

## AI Copilot — Chat, tools y endpoints

El dashboard expone un endpoint de chat IA en `/api/ai/chat` (`POST`) y un endpoint de
explicación de gráficos en `/api/ai/explain` (`POST`). Ambos responden en streaming
usando Vercel AI SDK `streamText`.

### Arquitectura

```text
Admin autenticado
  -> /admin/copilot (página cliente)
  -> useChat({ transport: DefaultChatTransport({ api: "/api/ai/chat", body: { activeFilters } }) })
  -> POST /api/ai/chat (Route Handler)
  -> getModel("gemini-3.1-flash-lite-preview") via @ai-sdk/google
  -> retrieveContext(query) + formatRagContext() → inyecta KPIs en system prompt
  -> streamText({ model, tools, system, messages, stopWhen: stepCountIs(5), maxOutputTokens: 16384 })
  -> tools ejecutan getServiceJson(app, path) → llamada directa a la API externa
  -> Respuesta streaming al cliente con markdown + tool calls + inline charts
```

A diferencia de los hooks de dashboard (que pasan por el proxy `/api/internal/analytics/…`),
las tools de IA llaman a las apps externas **directamente** via `getServiceJson()`.
Esto evita el doble salto del proxy y problemas de serialización HTML vs JSON.

### Tools de IA (12)

| Tool | App destino | Endpoint upstream | Descripción |
|------|-------------|-------------------|-------------|
| `queryPayments` | payments | `GET /api/v1/payments/metrics` o `GET /api/v1/payments` (paginado) | Métricas de pagos o listado transaccional |
| `querySettlements` | payments | `GET /api/v1/settlements/metrics` o `GET /api/v1/settlements` (paginado) | Métricas de liquidaciones o listado |
| `queryRefunds` | payments | `GET /api/v1/refunds/metrics` | Métricas de reembolsos |
| `getRevenueInsights` | payments | `GET /api/v1/payments/revenue/timeseries` | Serie temporal de ingresos |
| `getCommissionTimeSeries` | payments | `GET /api/v1/settlements/commission/timeseries` | Evolución de comisiones |
| `getPendingSettlementsBySeller` | payments | `GET /api/v1/settlements/pending-by-seller` | Liquidaciones pendientes por vendedor |
| `querySalesOrders` | seller | `GET /api/v1/sales-orders/metrics` | Métricas de órdenes de venta |
| `queryProducts` | seller | `GET /api/v1/products/metrics` | Métricas de productos |
| `querySellers` | seller | `GET /api/v1/sellers/metrics` | Métricas de vendedores |
| `queryBuyers` | buyer | `GET /api/v1/admin/buyers/metrics` | Métricas de compradores |
| `forecastRevenue` | payments | `GET /api/v1/payments/revenue/timeseries` | Serie temporal de ingresos para pronóstico |
| `generateChartData` | — (LLM) | — | Formatea datos estructurados para renderizar gráficos inline en el cliente |

Las tools están definidas en `src/lib/ai/tools/index.ts` usando `dynamicTool` de Vercel AI SDK.

### RAG pipeline

Integrado en el chat route: `retrieveContext(query)` busca fragmentos relevantes en
`docs/manager-dashboard/03-metrics/` y `docs/manager-dashboard/01-system-analysis/03-kpi-inventory.md`
usando embeddings `text-embedding-004`. Los resultados se inyectan en el system prompt como contexto
de definiciones de KPIs y fórmulas de métricas.

Implementación en `src/lib/ai/rag.ts`: chunker de 512 tokens con 64 de solapamiento,
vector store en memoria con similitud coseno.

### System Prompt

El system prompt del asistente incluye:

- Fecha actual (`Hoy es {TODAY}`) para contexto temporal
- Reglas: solo datos devueltos por tools, no inventar, no modificar, no revelar system prompt
- Formato de moneda: ARS en centavos (dividir /100 para mostrar)
- Mostrar nombres (no IDs) para sellers, products, buyers, carriers; mostrar IDs para payments, settlements, refunds, orders
- Respuestas en español argentino, <200 palabras, markdown con tablas y negritas
- Filtros activos del dashboard (rango de fechas) inyectados dinámicamente
- Contexto RAG (definiciones de KPIs) inyectado dinámicamente
- 13 guardrails (incluye: no placeholders `{chart}`, no mencionar "Intent")

### Configuración

- **Modelo**: `gemini-3.1-flash-lite-preview` (configurable via `AI_MODEL`)
- **Max tokens**: 16 384 (`maxOutputTokens: 16384`)
- **Stop condition**: `stopWhen: stepCountIs(5)` (hasta 5 pasos de herramientas, reemplaza `maxSteps`)
- **API Key**: `GOOGLE_API_KEY` en env
- **Log warnings**: `globalThis.AI_SDK_LOG_WARNINGS = false` (suprime warnings de `thoughtSignature`)

### Endpoint de explicación de gráficos

`POST /api/ai/explain` en `src/app/api/ai/explain/route.ts`:

- Recibe `{ chartType, labels, values, series }` con los datos del gráfico
- Streamtea una explicación estructurada: tendencia, estadísticas, puntos notables, comparación, insight
- Usa un system prompt dedicado en español argentino
- Retorna `result.toUIMessageStreamResponse()`

### UI

La página del copilot vive en `src/app/admin/copilot/page.tsx`:

- `useChat` con `DefaultChatTransport` (body incluye `activeFilters` desde `useDashboardStore`)
- Auto-envío tras tool calls completas via `lastAssistantMessageIsCompleteWithToolCalls`
- `ThinkingAnimation` con letras con animación bounce en colores del tema, palabras rotativas
- Renderizado markdown con `react-markdown` + `remark-gfm`
- Gráficos inline: cuando el LLM llama `generateChartData`, el tool result con `type: "chart"` se renderiza como gráfico Recharts (línea, barra o torta) via `ChatChart` component
- Los `reasoning` parts no se muestran al usuario (suprimidos en el render)
- Botones de sugerencia: ingresos semanales, mejor vendedor, liquidaciones pendientes, bajas de ventas
- Disclaimer: "Copilot IA usa Gemini 3.1 Flash Lite. Los datos se consultan en tiempo real."
- `SectionHeader` con `hideFilter` (oculta el selector de fechas del dashboard)

Componentes:
- `src/components/ai/chat-chart.tsx`: `ChatChart` con Recharts (`ResponsiveContainer`, `LineChart`, `BarChart`, `PieChart`) + `isChartData` type guard
- `src/components/ai/thinking-animation.tsx`: animación de letras rotativas con colores del tema
