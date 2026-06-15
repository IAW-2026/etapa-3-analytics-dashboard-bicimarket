# 1.3 — APIs (resumen)

> Resumen para contexto AI. **Las firmas exactas con request/response JSON viven en `proyecto-c-etapa-1-bicimarket/preview/03-apis.md`** — esa es la fuente de verdad. Acá solo el catálogo y las convenciones.

## Convenciones globales

- Verbos: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`. Nada más.
- Base path: `/api/v1/...` para negocio, `/api/internal/...` para server-to-server, `/webhooks/...` para externos (solo Mercado Pago).
- Headers de toda llamada inter-app: `X-Service-Token`, `X-Request-Id`, `Content-Type: application/json`.
- IDs con prefijo: `ord_`, `prd_`, `slp_`, `byp_`, `shp_`, `pay_`, `set_`, `pkg_`, `qte_`, `sor_`, `osg_`.
- Montos en centavos (int), currency `"ARS"`.
- Timestamps en ISO 8601 UTC.

## Endpoints por app (catálogo)

### 🛒 Buyer App
- Perfil: `GET|PUT /api/v1/buyer-profile/me`.
- Direcciones: `GET|POST /api/v1/addresses`, `PUT|DELETE /api/v1/addresses/{id}`.
- Carrito: `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PATCH|DELETE /api/v1/cart/items/{id}`.
- Favoritos: `GET|POST /api/v1/favorites`, `DELETE /api/v1/favorites/{id}`.
- Órdenes: `POST|GET /api/v1/orders`, `GET /api/v1/orders/{id}`, `POST /api/v1/orders/{id}/cancel`.
- Server-to-server: `PATCH /api/v1/orders/{id}/status` (de Payments), `PATCH /api/v1/orders/{id}/seller-groups/{g}/shipping` (de Shipping).

### 🏪 Seller App
- Perfil: `GET|PUT /api/v1/seller-profile/me`.
- Server-to-server: `GET /api/v1/seller-profile/{id}/pickup-address`.
- Catálogo: `GET /api/v1/products` (filtros, paginación), `GET /api/v1/products/{id}`, `GET /api/v1/products/{id}/availability`.
- Gestión productos: `POST|PATCH|DELETE /api/v1/products`, `POST|DELETE /api/v1/products/{id}/images`.
- Sub-órdenes: `POST /api/v1/sales-orders` (de Payments), `GET /api/v1/sales-orders`, `GET /api/v1/sales-orders/{id}`, `POST /api/v1/sales-orders/{id}/accept|reject`, `PATCH /api/v1/sales-orders/{id}/prepare`.
- Server-to-server: `PATCH /api/v1/sales-orders/{id}/payment-status`, `PATCH /api/v1/sales-orders/{id}/shipping-status`.
- Inventario: `PATCH /api/v1/products/{id}/stock`, `GET /api/v1/inventory-movements`.

### 🚚 Shipping App
- Cotizaciones: `POST /api/v1/shipping-quotes`.
- Envíos: `POST /api/v1/shipments`, `GET /api/v1/shipments/{id}`, `GET /api/v1/shipments?orderId=`, `PATCH /api/v1/shipments/{id}/status`.
- Paquetes: `POST /api/v1/shipments/{id}/packages`.
- Tracking: `POST|GET /api/v1/shipments/{id}/tracking-events`, `POST /api/v1/shipments/{id}/deliver`.
- Operadores: `GET|POST /api/v1/logistics-operators`, `GET /api/v1/my/assignments`, `POST|PATCH /api/v1/shipments/{id}/assignments`.

### 💳 Payments App
- Pagos: `POST /api/v1/payments`, `GET /api/v1/payments/{id}`, `GET /api/v1/payments?orderId=`, `PATCH /api/v1/payments/{id}/confirm`, `POST /api/v1/payments/{id}/refund|cancel`.
- Comprobantes: `GET /api/v1/receipts/{id}`.
- Settlements: `POST|GET /api/v1/settlements`, `GET /api/v1/settlements?sellerId=`, `POST /api/v1/payouts`.
- **Único webhook externo**: `POST /webhooks/mercadopago`.
- Server-to-server: `POST /api/v1/internal/shipment-delivered` (de Shipping).

### 💬 Feedback App *(opcional)*
- `POST|GET /api/v1/reviews`, `GET /api/v1/reviews/summary`.

## Patrón de implementación en este template

- Endpoint público de negocio: `src/app/api/v1/<recurso>/route.ts`.
- Endpoint server-to-server: `src/app/api/internal/<recurso>/route.ts`. Usar `requireServiceToken` de `src/lib/service-auth.ts`. Ejemplo en `src/app/api/internal/ping/route.ts`.
- Llamada saliente a otra app: `callServiceApi("seller", "/api/v1/products/...", ...)` de `src/lib/service-auth.ts`.

## Ver también

Para cada endpoint, el JSON exacto de request/response y los códigos de error: `preview/03-apis.md` (~70 endpoints documentados).
