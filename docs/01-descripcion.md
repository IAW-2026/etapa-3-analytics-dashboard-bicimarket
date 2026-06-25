# 1.1 — Descripción del sistema (resumen)

> Resumen de contexto para agentes AI y devs nuevos al template. La descripción completa con diagramas vive en `proyecto-c-etapa-1-bicimarket/preview/01-descripcion.md`.

## Qué es BiciMarket

Marketplace de bicicletas y repuestos. Conecta vendedores con compradores finales. Soporta **órdenes multi-vendedor**: una compra puede contener productos de varios vendedores y se descompone automáticamente en sub-órdenes, paquetes y liquidaciones por vendedor.

## Apps

| App | Rol |
|---|---|
| **Buyer** | Dueña del carrito y de la `order` (fuente de verdad de `order_id`). |
| **Seller** | Dueña del catálogo, stock, peso/dimensiones del producto, y de las `sales_orders` (sub-orden por vendedor). |
| **Shipping** | Dueña de los `shipments`, paquetes, cotizaciones, eventos de tracking. |
| **Payments** | Pasarela de pagos (Mercado Pago), settlements y payouts. |
| **Feedback** *(opcional)* | Reseñas post-entrega. |

## Comunicación

- Entre apps: **solo REST clásico** (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`) con `X-Service-Token`.
- UI ↔ backend propio: JWT de Clerk de **esta** app.
- Único webhook real del sistema: **Mercado Pago → Payments** (`POST /webhooks/mercadopago`).

## Flujo principal de compra

1. Comprador agrega items al carrito en Buyer App. Buyer consulta `availability` en Seller.
2. Buyer cotiza envío en Shipping (uno por seller-group). Recibe `cost_cents`, `weight_grams`, `expires_at`.
3. Buyer crea la `order` con `pending_payment` y llama a Payments con el total (items + envíos).
4. Payments crea la preferencia en Mercado Pago, devuelve `checkout_url`.
5. Comprador paga; MP notifica a Payments por su webhook.
6. Payments confirma el pago, hace `PATCH /orders/{id}/status` en Buyer (`paid`) y `POST /sales-orders` en Seller (uno por vendedor).
7. Seller acepta y prepara, dispara `POST /shipments` en Shipping.
8. Shipping mueve el envío y notifica con `PATCH` REST a Buyer y Seller.
9. Tras la entrega, Shipping hace `POST /api/v1/internal/shipment-delivered` en Payments.
10. Payments libera la liquidación al vendedor con `POST /v1/transfers` a MP.

## Documentación canónica

| Doc | Qué contiene |
|---|---|
| `preview/01-descripcion.md` | Esta descripción + diagramas de carril por flujo. |
| `preview/02-responsabilidades.md` | Qué hace y qué NO hace cada app, reglas transversales. |
| `preview/03-apis.md` | Todos los endpoints con request/response JSON. |
| `preview/04-modelo-de-datos.md` | DB por app, máquinas de estado. |
| `preview/05-usuarios.md` | Un Clerk por app + identidad cruzada. |
| `preview/06-estados-y-diagramas.md` | Casos no-felices y transiciones permitidas. |
