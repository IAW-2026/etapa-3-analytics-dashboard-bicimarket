# BiciMarket — Analytics Dashboard

Panel administrativo del marketplace **BiciMarket**. Muestra métricas consolidadas de compras, ventas, envíos y pagos en un solo lugar. Incluye un asistente IA conversacional para consultar datos en lenguaje natural.

> Read-only: el dashboard consulta las 4 apps del marketplace (Buyer, Seller, Shipping, Payments) pero nunca escribe ni tiene base de datos propia.

---

## Deploy

**https://etapa-3-analytics-dashboard-bicimar.vercel.app/**

---

## Acceso

| Tipo | email | contraseña | ¿qué ves? |
|---|---|---|---|
| Administrador | `adminpaymentsclerk_test@iaw.com` | iawuser# | Dashboard completo con métricas, gráficos y Copilot IA |
| Usuario común | `buyer1clerk_test@iaw.com` | iawuser# | Pantalla de "Acceso restringido" — no tiene `admin: true` |

**Cualquier usuario autenticado sin `publicMetadata.admin = true` en Clerk no puede pasar de la pantalla de bienvenida.**

---

## Stack

- **Next.js 16** — App Router
- **Clerk** — Autenticación con JWT + `publicMetadata`
- **TanStack Query** — Data fetching reactivo
- **Recharts** — Gráficos
- **AI SDK (Vercel)** — Copilot con Gemini 3.1 Flash Lite
- **Zustand** — Estado global (filtros de fecha)
- **shadcn/ui** + **Tailwind CSS 4** — UI
