# 1.2 — Responsabilidades (resumen)

> Resumen para contexto AI. Detalle completo en `proyecto-c-etapa-1-bicimarket/preview/02-responsabilidades.md`.

## Reglas transversales (todas las apps)

1. Todos los endpoints bajo `/api/v1/...`.
2. Auth:
   - UI propia → `Authorization: Bearer <JWT-Clerk-de-esta-app>`.
   - App → app → `X-Service-Token: <secret-del-par>`.
3. Errores: `{ "error": { "code": "...", "message": "...", "details": {} } }`.
4. Paginación: `?page=1&limit=20` con response `{ data, pagination }`.
5. Idempotencia: POST de creación acepta `Idempotency-Key`.
6. Snapshots inmutables: cuando guardás un dato cuya verdad vive en otra app, lo congelás al momento de la transacción.
7. Notificaciones inter-apps: REST `POST`/`PATCH` normal, retry 3× (1s/3s/9s).
8. Multi-vendedor: una `order` se descompone en N grupos por seller a nivel de cada app.

## Quién es dueño de qué

| Recurso | Dueña | Las demás apps |
|---|---|---|
| `order_id`, `order_status` | **Buyer** | guardan referencia opaca |
| `product`, precio, stock, peso, dimensiones | **Seller** | guardan snapshot |
| `sales_order` (sub-orden por seller) | **Seller** | espejada en Buyer y Shipping |
| `shipment_id`, tracking, paquetes | **Shipping** | guardan `shipping_status` espejo |
| `payment_id`, settlement, payout | **Payments** | reciben notificaciones |

## Qué consume cada app de las otras

### Buyer
- Seller: `GET /products`, `GET /products/{id}`, `GET /products/{id}/availability`.
- Shipping: `POST /shipping-quotes`, `GET /shipments?orderId=`, `GET /shipments/{id}/tracking-events`.
- Payments: `POST /payments`, `GET /payments?orderId=`, `GET /receipts/{id}`.

### Seller
- Shipping: `POST /shipments`, `POST /shipments/{id}/packages`.
- Payments: `GET /settlements?sellerId=`, `POST /payments/{id}/refund`.

### Shipping
- Seller: `GET /seller-profile/{id}/pickup-address`.
- Notifica a Buyer (`PATCH /orders/{id}/seller-groups/{g}/shipping`), Seller (`PATCH /sales-orders/{id}/shipping-status`) y Payments (`POST /api/v1/internal/shipment-delivered`).

### Payments
- Buyer: `GET /orders/{id}` para validar.
- Notifica a Buyer (`PATCH /orders/{id}/status`) y Seller (`POST /sales-orders`, `PATCH /sales-orders/{id}/payment-status`).
- Externo: Mercado Pago (`POST /v1/payments`, `POST /v1/transfers`, `POST /v1/refunds`).

## Qué NO hace cada app

- **Buyer** no procesa pagos ni agenda envíos — los orquesta.
- **Seller** no conoce el total de la `order` ni libera pagos.
- **Shipping** no cobra envíos ni mantiene stock.
- **Payments** no conoce productos individuales, solo seller, monto y orden.

## Ver también

`preview/02-responsabilidades.md` §3-§7 para los compromisos completos por app y §9 para la tabla maestra de comunicación.
