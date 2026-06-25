# 1.4 — Modelo de datos (resumen)

> Resumen para contexto AI. Esquema completo con campos, índices y diagramas en `proyecto-c-etapa-1-bicimarket/preview/04-modelo-de-datos.md`.

## Regla de oro

**Cada app tiene su propia DB**. Nunca se accede a la DB de otra app — la única vía es la API de esa app.

## Convenciones comunes

- ORM: **Prisma**.
- IDs: `String @id @default(cuid())` con prefijo de recurso (`ord_`, `prd_`, `pay_`, etc.).
- Timestamps: `created_at @default(now())`, `updated_at @updatedAt`.
- Soft delete: `deleted_at DateTime?` en entidades con historial.
- Snapshots: campos `_snapshot` que **nunca se actualizan** una vez guardados.
- Referencias a otras apps: string opaco, **sin foreign key**.
- Auditoría: tablas `*_status_history` para cambios de estado relevantes.

## Entidades por app

### Buyer (`buyer_db`)
`buyer_profiles`, `addresses`, `carts`, `cart_items`, `favorite_items`, `orders`, **`order_seller_groups`** (uno por seller dentro de la order), `order_items`, `order_status_history`.

### Seller (`seller_db`)
`seller_profiles`, `products` (con `weight_grams`, `length_cm`, `width_cm`, `height_cm`), `product_images`, `inventory_movements`, `sales_orders`, `sales_order_items`, `sales_order_status_history`.

### Shipping (`shipping_db`)
`logistics_operators`, `shipping_rates`, `shipping_quotes` (TTL 60 min), `shipments`, `packages`, `tracking_events`, `delivery_assignments`, `delivery_proofs`.

### Payments (`payments_db`)
`payments`, `payment_attempts`, `receipts`, `settlements` (uno por seller dentro del payment), `payouts`, `refunds`, `mp_webhook_events`, `outbound_calls_log`.

### Feedback (`feedback_db`, opcional)
`reviews`, `review_summaries`.

## Identidad cruzada

Cada app tiene su **propio Clerk**. El `id` de la tabla `User` (en este template) es el `clerk_user_id` de **esta** app. Las apps que reciben usuarios de otras (típicamente Payments y Feedback) mantienen una tabla `user_links` que correlaciona por email.

## Máquinas de estado (resumen)

- `order.status`: `pending_payment → paid → partially_shipped → shipped → delivered → completed`. Alts: `cancelled`, `refunded`, `payment_failed`.
- `order_seller_group.status`: `pending → preparing → ready_to_ship → in_transit → delivered → settled`.
- `sales_order.fulfillment_status`: `pending → accepted → preparing → ready_to_ship → handed_over → delivered`. Alts: `rejected`, `cancelled`.
- `shipment.status`: `created → ready_for_pickup → picked_up → in_transit → out_for_delivery → delivered`. Alts: `failed_delivery`, `returned`.
- `payment.status`: `pending → approved`. Alts: `rejected`, `cancelled`, `refunded`.
- `settlement.status`: `pending → paid`. Alts: `failed`, `manual_review`.

Tablas de transiciones permitidas en `preview/06-estados-y-diagramas.md` §5.

## Cómo arranca cada fork

El `prisma/schema.prisma` de este template viene con un solo modelo `User` que es el espejo local del Clerk de **esta** app. Cada fork:

1. Reemplaza ese `User` por las entidades de su app según `preview/04-modelo-de-datos.md`.
2. Si necesita conservar la noción de "perfil del usuario que se loguea acá", lo modela como `buyer_profile` / `seller_profile` / `logistics_operator` con `clerk_user_id` como FK.
3. Corre `npx prisma migrate dev --name init`.
