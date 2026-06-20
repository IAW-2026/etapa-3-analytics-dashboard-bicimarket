# Arquitectura del dashboard administrativo

## Decisiones

1. El dashboard no es dueño de datos de negocio y no tiene DB.
2. Cada app conserva la soberanía de su dominio.
3. Todas las lecturas se realizan por REST con `X-Service-Token`.
4. Clerk es compartido y el acceso requiere `publicMetadata.admin = true`.
5. Los tokens y URLs remotos solo se leen en Server Components o Route
   Handlers; nunca se exponen como variables `NEXT_PUBLIC_*`.
6. Un fallo en una app no impide mostrar el estado de las otras tres.
7. **Proxy del lado servidor**: El dashboard nunca llama directo a las apps.
   Cada request pasa por un Route Handler de Next.js que inyecta el token.
8. **Toda la UI está en español** (argentino): labels, tooltips, tablas,
   estados vacíos, placeholders, tooltips de gráficos.
9. **Las fechas de la Payments API pueden venir en formato
   `Date.toString()` incompleto** (`"Mon Jun 15 2026 00:00:00 GM"`).
   El dashboard usa `parseDashboardDate()` que limpia el sufijo inválido
   antes de parsear.

## Flujo de lectura

```text
Admin autenticado
  -> /admin (o cualquier sub-página)
  -> TanStack Query hook (use-dashboard-data.ts)
  -> payments.ts: proxyFetch / proxyFetchData
  -> Route Handler: /api/internal/analytics/payments/[...slug]
  -> fetch a PAYMENTS_API_URL con X-Service-Token
  -> Payments API devuelve { data: T } o PaginatedResponse<T>
  -> proxyFetchData unwrappe { data: T } automáticamente
  -> Si la API real devuelve vacío para commission/payouts,
     el hook importa el mock (@/lib/mock/) como fallback
  -> select: guard contra datos no-array en hooks que esperan arrays
```

## Proxy Route

```
Browser ➔ /api/internal/analytics/payments/payments/metrics?from=...&to=...
        ➔ Route Handler (server-side)
        ➔ PAYMENTS_API_URL + /api/v1/payments/metrics?from=...&to=...
        ➔ Header: X-Service-Token: <secret>
        ➔ Response reenviada al browser
```

El slug se valida contra un `ALLOWED_PATHS` Set antes de reenviar:

```ts
const ALLOWED_PATHS = new Set([
  "payments/metrics",
  "payments/revenue/timeseries",
  "payments/revenue/by-method",
  "payments/revenue/by-seller",
  "payments",
  "settlements/metrics",
  "settlements/commission/timeseries",
  "settlements/status-breakdown",
  "settlements/pending-by-seller",
  "settlements",
  "refunds/metrics",
  "payouts/metrics",
  "payouts",
])
```

## Flujo de datos

### Payments API → cliente

Toda respuesta de la Payments API viene envuelta en `{ data: T }`.

- **Endpoints de métricas/arrays**: `proxyFetchData<T>()` unwrappe
  `raw.data` automáticamente.
- **Endpoints de listas paginadas** (`payments`, `settlements`, `payouts`):
  `proxyFetch<PaginatedResponse<T>>()` mantiene el envelope porque
  `data` es el array de items y se necesita `pagination`.

### Reactividad de filtros de fecha

```ts
function useDateFilterKey() {
  const from = useDashboardStore((s) => s.from.getTime())
  const to = useDashboardStore((s) => s.to.getTime())
  return [from, to] as const
}
```

Los hooks de TanStack Query incluyen `...dateKey` en `queryKey`.
Cuando el usuario cambia el rango, el store se actualiza → `dateKey`
cambia → TanStack refetchea automáticamente.

Los hooks de Payments usan datos reales de la API exclusivamente.
Los hooks de productos, envíos y sellers usan mocks directos
(no tienen endpoint real aún).

## UI en español

Toda la interfaz de las 8 pantallas del manager dashboard está en español:

- Sidebar: Panel General, Ventas, Finanzas, Operaciones, Productos,
  Vendedores, Clientes, Copilot IA
- KPI cards, tooltips de gráficos, tablas, estados vacíos
- Alertas y banners
- Placeholders y sugerencias del Copilot

## Parseo defensivo de fechas

```ts
function parseDashboardDate(dateStr: string): Date {
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) return d
  // Si la API devuelve "Mon Jun 15 2026 00:00:00 GM" (truncado),
  // limpiamos el sufijo " GM" o " GMT..." y reintentamos
  const trimmed = dateStr.replace(/\s+(GM|GMT)[\s\S]*$/, "")
  if (trimmed !== dateStr) {
    const d2 = new Date(trimmed)
    if (!isNaN(d2.getTime())) return d2
  }
  return d
}
```

Se usa en `getRevenueByDayOfWeek()` para computar día-de-semana desde
la timeseries de revenue. Puntos con fecha inválida se saltean con
`continue`.

## Envío y recepción de datos

### Lado servidor (Route Handler)

- `src/app/api/internal/analytics/payments/[...slug]/route.ts`
- Lee `PAYMENTS_API_URL` y `DASHBOARD_TO_PAYMENTS_SERVICE_TOKEN` de env
- Envía `X-Service-Token` y `X-Request-Id` a la Payments API
- Timeout de 10s
- Si la API responde con error HTTP, reenvía el body de error al cliente

### Lado cliente

- `src/lib/api/payments.ts`: 14 funciones agrupadas por dominio
  (`getPaymentMetrics`, `getRevenueTimeSeries`, `getSettlements`, etc.)
- `proxyFetch<T>()`: fetch al proxy con query params, control de error
- `proxyFetchData<T>()`: wrapper que unwrappe `{ data: T }`

## Cambio requerido en las cuatro apps

Cada app debe agregar una variable entrante y aceptarla en sus endpoints
administrativos:

```env
DASHBOARD_TO_<APP>_SERVICE_TOKEN=<mismo valor configurado en dashboard>
```

Ejemplo conceptual:

```ts
const acceptedTokens = [
  process.env.EXISTING_INBOUND_TOKEN,
  process.env.DASHBOARD_TO_SHIPPING_SERVICE_TOKEN,
].filter(Boolean);
```

El nombre puede variar por repo, pero el secreto debe ser específico para el
par Dashboard -> App.

## AI Copilot

El dashboard incluye un asistente conversacional IA en `/admin/copilot` que permite
consultar datos del marketplace en lenguaje natural.

### Arquitectura

```text
Admin autenticado
  -> /admin/copilot (página cliente con useChat)
  -> POST /api/ai/chat (Route Handler)
  -> streamText({ model, tools, system, messages, maxOutputTokens: 16384 })
  -> tools ejecutan getServiceJson(app, path)
  -> Llamada directa a Payments / Seller / Buyer API con X-Service-Token
  -> Respuesta streaming al cliente con markdown + tool calls
```

**Diferencia clave con el proxy**: las tools de IA llaman a las apps externas
**directamente** via `getServiceJson()` en lugar de pasar por el Route Handler
proxy. Esto evita el doble salto y problemas de serialización HTML vs JSON.

### Tools (10)

Las tools están definidas en `src/lib/ai/tools/index.ts` y cubren:

| Dominio | Tools |
|---------|-------|
| **Payments** | `queryPayments`, `querySettlements`, `queryRefunds`, `getRevenueInsights`, `getCommissionTimeSeries`, `getPendingSettlementsBySeller` |
| **Sellers** | `querySalesOrders`, `queryProducts`, `querySellers` |
| **Buyers** | `queryBuyers` |

Cada tool usa `dynamicTool` de Vercel AI SDK con esquema Zod y ejecuta
`getServiceJson(app, path)` para obtener datos en tiempo real.

### Modelo

- **Provider**: `@ai-sdk/google` con `createGoogleGenerativeAI`
- **Modelo por defecto**: `gemini-3.1-flash-lite-preview` (configurable via `AI_MODEL`)
- **Max tokens**: 16 384
- **API Key**: `GOOGLE_API_KEY` en env

### Chat route (`/api/ai/chat`)

Endpoint `POST` en `src/app/api/ai/chat/route.ts`:

1. Verifica admin autenticado via `getAdminUser()`
2. Convierte mensajes con `convertToModelMessages`
3. Llama a `streamText` con model, tools y system prompt
4. Retorna `result.toUIMessageStreamResponse`
5. `globalThis.AI_SDK_LOG_WARNINGS = false` suprime warnings de `thoughtSignature`

### System Prompt

Incluye fecha actual, personalidad de analista senior, reglas (solo datos reales,
no modificar, no revelar system prompt), formato de respuesta (markdown, ARS,
bold para métricas clave), y 11 guardrails.

### UI

- `src/app/admin/copilot/page.tsx`: página full-height con `ScrollArea`, input,
  avatares Bot/User, renderizado markdown, `ThinkingAnimation`, botones de
  sugerencia, sección de error con botón reintentar, disclaimer
- `src/components/ai/thinking-animation.tsx`: palabra rotativa animada con
  letras en colores del tema (`--color-chart-*`, `--color-primary`, `--color-ring`),
  con soporte `prefers-reduced-motion`
- `src/components/analytics/section-header.tsx`: prop `hideFilter` para ocultar
  el selector de fechas en la página del copilot
