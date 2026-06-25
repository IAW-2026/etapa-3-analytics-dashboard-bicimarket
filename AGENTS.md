<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Contexto para agentes AI — Analytics Dashboard BiciMarket

> Este repo es el **Analytics Dashboard** del marketplace BiciMarket. No es un template para forkear — es una app read-only que consume datos de las 4 apps del marketplace (Buyer, Seller, Shipping, Payments). La fuente de verdad detallada vive en `docs/`.

## Qué es este repo

Dashboard administrativo Next.js que presenta métricas, gráficos y un asistente IA para administradores del marketplace BiciMarket. No tiene base de datos propia ni es dueña de datos de negocio.

## Reglas que NO se rompen

1. **Read-only**: el dashboard nunca escribe datos en las apps del marketplace. Solo consulta.
2. **Sin DB**: no hay Prisma, no hay schema local, no hay migraciones.
3. **Proxy del lado servidor**: los hooks de dashboard (TanStack Query) leen via Route Handler proxy en `/api/internal/analytics/{app}/[...slug]`. Las tools de IA llaman directo via `getServiceJson()`.
4. **Auth de llamadas inter-apps**: `X-Service-Token: <secret>`. Patrón en `src/lib/service-auth.ts`. El dashboard envía tokens pero no recibe (Clerk autentica al admin).
5. **Versionado de API**: prefi​jo `/api/v1/...` para endpoints de negocio. `/api/internal/...` para server-to-server. `/webhooks/...` solo para externos (Mercado Pago).
6. **Montos en centavos** (`amount_cents: int`). Currency siempre `"ARS"` — dividir por 100 para mostrar.
7. **IDs con prefijo** estilo Stripe: `ord_…`, `prd_…`, etc.
8. **Formato de error** uniforme: `{ "error": { "code": "...", "message": "...", "details": {} } }`.
9. **Fechas**: la Payments API puede devolver `Date.toString()` incompleto. Usar `parseDashboardDate()`.
10. **UI en español argentino**: labels, tooltips, tablas, tooltips de gráficos.

## AI Copilot

- Endpoint: `POST /api/ai/chat` — streaming con `streamText` + `DefaultChatTransport`
- 10 tools definidas en `src/lib/ai/tools/index.ts` que llaman directo a las apps via `getServiceJson()`
- Modelo: Gemini 3.1 Flash Lite (`@ai-sdk/google`), configurable via `AI_MODEL`
- System prompt con fecha actual, reglas de formato (ARS, nombres vs IDs), 11 guardrails
- `maxOutputTokens: 16384`
- UI en `src/app/admin/copilot/page.tsx` con `useChat`, `ThinkingAnimation`, markdown

## Cómo decidir dónde poner código nuevo

| Tipo de código | Carpeta |
|---|---|
| Endpoint de negocio en app externa (dashboard consumo) | No tocar — el dashboard es read-only |
| Route Handler proxy | `src/app/api/internal/analytics/<app>/[...slug]/route.ts` |
| Chat IA | `src/app/api/ai/chat/route.ts` |
| Tool de IA | `src/lib/ai/tools/index.ts` (agregar a `dashboardTools`) |
| Helper compartido | `src/lib/` |
| API client de dashboard | `src/lib/api/<app>.ts` (usa proxy) |
| Página protegida | `src/app/admin/<ruta>/page.tsx` (clerk auth via middleware) |
| Componente UI | `src/components/` |

## Antes de proponer cambios

1. Leer la documentación relevante en `docs/`.
2. Si el cambio agrega un endpoint de IA, registrar la tool en `docs/03-apis.md` (tabla de Tools de IA).
3. Validar que el endpoint nuevo respete las convenciones de `docs/03-apis.md` (headers, paginación, errores).
