# 1.1 — Existing Applications Analysis

> **Manager Dashboard — System Analysis**
>
> This document analyzes all four applications of the BiciMarket ecosystem from the perspective of a centralized management dashboard. Every statement is derived from `/documentacion/`.

---

## Overview

BiciMarket is a marketplace of bicycles and parts connecting sellers with buyers. Four independent applications (each with its own database, API, and Next.js deployment) communicate exclusively via REST over HTTP with `X-Service-Token` authentication. A single shared Clerk project handles authentication across all apps.

| App | Role | Domain | Database |
|-----|------|--------|----------|
| Buyer App | Shopping frontend | Orders, carts, buyer profiles | `buyer_db` |
| Seller App | Seller backend | Products, catalog, sales orders | `seller_db` |
| Shipping App | Logistics | Shipments, tracking, operators | `shipping_db` |
| Payments App | Payment gateway | Payments, settlements, payouts | `payments_db` |

All communication between apps is REST. The only webhook in the system is the Mercado Pago webhook at `POST /webhooks/mercadopago`.

---

## 1. Buyer App

**Owner**: Camila Rojas Fritz
**Repository**: `https://github.com/camilarojasfritz/proyecto-c-buyer-camilarojas`
**Domain URL**: `https://buyer.bicimarket.com`

### Purpose

Frontend for buyers to browse products, manage carts, place orders, and track purchases. It is the entry point for all customer-facing operations.

### Responsibilities

- Maintain buyer profiles (linked to shared Clerk user ID)
- Manage shipping addresses
- Own the active shopping cart (one per buyer, `active` or `converted`)
- Own the **order** entity — the single source of truth for `order_id`
- Decompose orders into `order_seller_groups` (one per seller in multi-vendor orders)
- Orchestrate checkout: validate availability via Seller, quote shipping via Shipping, initiate payment via Payments
- Expose a public product catalog (proxied from Seller App with ≤ 60s cache)
- Receive REST notifications from Payments (payment status changes) and Shipping (shipping status changes)
- Maintain wishlist (`favorite_items`)

### Domain Ownership

| Entity | Truth Source | Notes |
|--------|-------------|-------|
| `order_id` | **Buyer App** | All other apps reference it as opaque string |
| `buyer_profile` | Buyer App | Created lazily on first login |
| `addresses` | Buyer App | Shipping address snapshots sent to others |
| `cart` / `cart_items` | Buyer App | Snapshot of price/weight at add time |
| `favorite_items` | Buyer App | |
| `order_seller_groups` | Buyer App | One per seller in the order |
| `order_items` | Buyer App | Snapshots of product data |

### Main Features

- Product browsing (categories, search, filters)
- Cart management (add, remove, update quantity)
- Multi-seller checkout (single payment, split orders)
- Order history and status tracking
- Favorite products / wishlist
- Integration with Mercado Pago Wallet Brick for checkout UX

### Relevant APIs (consumed from other apps)

| Consumer | Endpoint | Purpose |
|----------|----------|---------|
| Seller | `GET /api/v1/products` | Catalog browsing |
| Seller | `GET /api/v1/products/{id}/availability` | Pre-checkout validation |
| Shipping | `POST /api/v1/shipping-quotes` | Cost estimation |
| Payments | `POST /api/v1/payments` | Initiate payment |

### Relevant APIs (exposed to other apps)

| Source | Endpoint | Trigger |
|--------|----------|---------|
| Payments | `PATCH /api/v1/orders/{id}/status` | Payment approved/rejected/refunded |
| Shipping | `PATCH /api/v1/orders/{id}/seller-groups/{g}/shipping` | Shipping status change |

### Events Exposed

No event bus. State changes are notified via REST calls (`PATCH`) from Payments and Shipping.

### Relevant Entities (for dashboard)

- `orders` — `id`, `status`, `total_cents`, `created_at`, `buyer_profile_id`
- `order_seller_groups` — `seller_profile_id`, `status`, `shipping_cost_cents`, `items_subtotal_cents`
- `order_items` — `product_id`, `product_name_snapshot`, `unit_price_cents`, `quantity`
- `order_status_history` — audit trail of status changes
- `buyer_profiles` — `id`, `created_at`
- `favorite_items` — `product_id`, `added_at`

### Relationships with Other Systems

| System | Relationship | Data Shared |
|--------|-------------|-------------|
| Seller App | Reads catalog + availability | Product IDs, prices, weights |
| Shipping App | Reads shipping quotes + tracking | Shipping costs, tracking numbers |
| Payments App | Creates payments, reads receipts | Payment IDs, checkout URLs |

---

## 2. Seller App

**Owner**: Pierino Spina
**Repository**: `https://github.com/Spinapierino7/proyecto-c-seller-pierinospina.git`
**Domain URL**: `https://seller.bicimarket.com`

### Purpose

Backend for sellers to manage their product catalog, view and fulfill sales orders, and track their financial settlements.

### Responsibilities

- Manage seller profiles (`verification_status`: `pending_review` → `verified` → `suspended`)
- Own the **product catalog** — single source of truth for price, weight, dimensions
- Manage product images (upload to S3/Supabase storage)
- Receive and manage `sales_orders` (sub-orders per seller within a buyer's order)
- Accept/reject/prepare/dispatch `sales_orders`
- Initiate shipment creation in Shipping App when ready
- No stock management (project constraint: unlimited stock)

### Domain Ownership

| Entity | Truth Source | Notes |
|--------|-------------|-------|
| `product_id`, price, weight | **Seller App** | Buyer App stores snapshots |
| `seller_profile` | Seller App | Requires admin verification |
| `sales_order` | Seller App | One per seller x buyer order |
| `product_images` | Seller App | S3/Supabase URLs |

### Main Features

- Product CRUD with categories (`mtb`, `road`, `urban`, `kids`, `bmx`, `parts`, `accessories`, `indumentaria`)
- Product image management
- Sales order management (accept, reject, prepare, ship)
- Seller profile management (tax info, bank account, pickup address)
- View settlements and payment status (consumed from Payments)

### Relevant APIs (consumed from other apps)

| Consumer | Endpoint | Purpose |
|----------|----------|---------|
| Shipping | `POST /api/v1/shipments` | Create shipment |
| Payments | `GET /api/v1/settlements?sellerId=X` | View settlements |
| Payments | `POST /api/v1/payments/{id}/refund` | Request refund |

### Relevant APIs (exposed to other apps)

| Source | Endpoint | Trigger |
|--------|----------|---------|
| Payments | `POST /api/v1/sales-orders` | Create sub-order after payment |
| Payments | `PATCH /api/v1/sales-orders/{id}/payment-status` | Payment settled/refunded |
| Shipping | `PATCH /api/v1/sales-orders/{id}/shipping-status` | Shipping status change |
| Buyer | `GET /api/v1/products` | Catalog |
| Buyer | `GET /api/v1/products/{id}/availability` | Pre-checkout |

### Events Exposed

No event bus. State changes received via REST from Payments and Shipping.

### Relevant Entities (for dashboard)

- `seller_profiles` — `id`, `display_name`, `verification_status`, `created_at`
- `products` — `id`, `title`, `category`, `price_cents`, `status`, `seller_profile_id`, `created_at`
- `sales_orders` — `id`, `fulfillment_status`, `payment_status`, `total_cents`, `created_at`, `seller_profile_id`

### Relationships with Other Systems

| System | Relationship | Data Shared |
|--------|-------------|-------------|
| Buyer App | Exposes catalog | Product IDs, prices, availability |
| Shipping App | Creates shipments | Product weights, addresses |
| Payments App | Receives payments + settlements | Settlement amounts, payment status |

### Implementation Notes

- Pagination default: `limit=50` (vs global `limit=20`)
- Seller App generates a new UUID for each outgoing call instead of propagating the incoming `X-Request-Id`
- **Known gap**: Seller App does NOT notify Buyer App with `PATCH /api/v1/orders/{id}/seller-groups/{g}/status` when accepting an order (documented discrepancy)

---

## 3. Shipping App

**Owner**: Enrique Seitz
**Repository**: `https://github.com/Enry6tz/proyecto-c-shipping-enriqueseitz`
**Domain URL**: `https://shipping.bicimarket.com`

### Purpose

Logistics management — owns all shipping operations from quotation to final delivery.

### Responsibilities

- Maintain shipping rate tables (by weight, zone, carrier)
- Provide shipping quotes with 60-minute TTL
- Create and manage shipments (one per seller per order)
- Group shipments into `shipment_groups` (one per order, global tracking `BMK-…` per ADR-006)
- Manage individual shipment tracking (`TRK-AR-…` per seller)
- Assign logistics operators to shipments
- Record tracking events and delivery proofs
- Notify Buyer, Seller, and Payments on status changes

### Domain Ownership

| Entity | Truth Source | Notes |
|--------|-------------|-------|
| `shipment_id` | **Shipping App** | |
| `tracking_events` | Shipping App | Full history |
| `delivery_proofs` | Shipping App | Photos, signatures |
| `shipping_quotes` | Shipping App | 60-min TTL |
| `shipment_groups` | Shipping App | Global tracking per ADR-006 |
| `logistics_operators` | Shipping App | |

### Main Features

- Shipping quotation (multi-seller in single request, multi-carrier)
- Shipment creation and package management
- Tracking event recording with state machine validation
- Delivery confirmation with proof (photo + signature)
- Logistics operator management (admin creates operators)
- Delivery assignments and reassignments
- Geolocation dataset (Argentine postal codes with coordinates)

### Relevant APIs (exposed to other apps)

| Consumer | Endpoint | Trigger |
|----------|----------|---------|
| Buyer | `POST /api/v1/shipping-quotes` | Checkout |
| Buyer | `GET /api/v1/shipments?orderId=X` | Tracking |
| Seller | `POST /api/v1/shipments` | Create shipment |
| Payments | `POST /api/v1/internal/shipment-delivered` | Trigger settlement |

### Notifications (outgoing)

| Destination | Endpoint | Status Change |
|-------------|----------|---------------|
| Buyer | `PATCH /api/v1/orders/{id}/seller-groups/{g}/shipping` | Any shipping status change |
| Seller | `PATCH /api/v1/sales-orders/{id}/shipping-status` | Any shipping status change |
| Payments | `POST /api/v1/internal/shipment-delivered` | `delivered` |

### Relevant Entities (for dashboard)

- `shipments` — `id`, `status`, `cost_cents`, `created_at`, `delivered_at`, `seller_profile_id`, `carrier`
- `shipment_groups` — `id`, `order_id`, `status`, `tracking_number`, `origins_count`
- `tracking_events` — `shipment_id`, `event_type`, `occurred_at`
- `delivery_proofs` — `delivered_at`
- `shipping_quotes` — `cost_cents`, `service_level`, `estimated_days_min/max`
- `logistics_operators` — `status`, `vehicle_type`
- `shipment_status_history` — audit trail

### Relationships with Other Systems

| System | Relationship | Data Shared |
|--------|-------------|-------------|
| Buyer App | Shipping quotes + tracking | Costs, status, tracking numbers |
| Seller App | Shipment creation + status | Shipment IDs, labels |
| Payments App | Delivery notification | Triggers settlement creation |

---

## 4. Payments App

**Owner**: Rocco Paoloni
**Repository**: `https://github.com/roccopaoloni/proyecto-c-payments-roccopaoloni` (this repo)
**Domain URL**: `https://payments.bicimarket.com` (admin UI only)

### Purpose

Central payment processing — handles payment creation, Mercado Pago integration, multi-seller settlements, payouts, refunds, and receipt generation.

### Responsibilities

- Create payments with Mercado Pago Checkout Pro (preferences API)
- Process Mercado Pago webhooks (the only webhook in the system)
- Manage payment lifecycle (`pending` → `approved`/`rejected`/`cancelled` → `refunded`)
- Calculate and create settlements per seller (10% marketplace commission)
- Manage payouts to sellers (manual: admin marks as paid)
- Process refunds (partial and full)
- Generate receipts
- Log all outbound inter-app calls and inbound webhook events

### Domain Ownership

| Entity | Truth Source | Notes |
|--------|-------------|-------|
| `payment_id` | **Payments App** | `external_reference = payment.id` for MP tracing |
| `settlements` | Payments App | One per seller per payment |
| `payouts` | Payments App | Manual admin action |
| `refunds` | Payments App | Partial or full |
| `receipts` | Payments App | PDF generation |
| `payment_attempts` | Payments App | Audit trail |
| `mp_webhook_events` | Payments App | Deduplication |

### Main Features

- Payment creation via MP Checkout Pro (preferences API)
- Webhook processing with HMAC-SHA256 signature validation
- Multi-seller settlement calculation (gross = subtotal + shipping, fee = 10%, net = gross - fee)
- Admin panel: refunds (partial/total), payouts, settlements
- Receipt generation
- Idempotency via permanent `Idempotency-Key` columns on resources

### Relevant APIs (exposed to other apps)

| Consumer | Endpoint | Trigger |
|----------|----------|---------|
| Buyer | `POST /api/v1/payments` | Checkout |
| Buyer | `GET /api/v1/payments` | Payment status |
| Buyer | `GET /api/v1/receipts` | Receipts |
| Seller | `GET /api/v1/settlements?sellerId=X` | Settlements |
| Seller | `POST /api/v1/payments/{id}/refund` | Refunds |

### Notifications (outgoing)

| Destination | Endpoint | Status Change |
|-------------|----------|---------------|
| Buyer | `PATCH /api/v1/orders/{id}/status` | Payment approved/rejected/refunded |
| Seller | `POST /api/v1/sales-orders` | Payment approved (create sub-order) |

> **Note**: Notifications are marked as "commented" in the documentation — implemented but currently disabled.

### Relevant Entities (for dashboard)

- `payments` — `id`, `order_id`, `amount_cents`, `status`, `method`, `approved_at`, `created_at`, `buyer_profile_id`
- `payment_attempts` — `status`, `error_code`, `error_message`, `attempt_number`
- `settlements` — `id`, `gross_amount_cents`, `fee_amount_cents`, `net_amount_cents`, `status`, `seller_profile_id`, `paid_at`
- `payouts` — `id`, `status`, `attempts`, `last_error`, `completed_at`
- `refunds` — `id`, `amount_cents`, `status`, `reason`, `created_at`
- `receipts` — `id`, `amount_cents`, `issued_at`

### Existing Admin Dashboard

The Payments App already includes an admin UI at `/admin/` with:
- Dashboard with 4 KPI cards: payments processed, transaction volume, pending settlements, failed transactions
- Sparkline trends per KPI
- Recent payments table
- Recent settlements table
- Date range filtering (Today, 7d, 30d, 90d, 1y)
- CRUD pages for payments, refunds, settlements, payouts, receipts

### Relationships with Other Systems

| System | Relationship | Data Shared |
|--------|-------------|-------------|
| Buyer App | Receives payment requests | Amounts, order IDs, seller breakdown |
| Seller App | Creates sales orders, reports settlements | Settlement amounts, payment status |
| Shipping App | Receives delivery notifications | Triggers settlement creation |
| Mercado Pago | Payment processing + webhooks | Payment IDs, checkout URLs |

---

## 5. Summary: Data Availability for Manager Dashboard

| Data Domain | Available In | Access Method | Dashboard Relevance |
|-------------|-------------|---------------|-------------------|
| Orders + items | Buyer App | `GET /api/v1/buyer/orders` | Core — order volume, revenue, trends |
| Products + catalog | Seller App | `GET /api/v1/products` | Core — best sellers, category analysis |
| Seller profiles | Seller App | `GET /api/v1/seller-profile/me` | Core — seller count, verification status |
| Sales orders | Seller App | `GET /api/v1/sales-orders` | Core — fulfillment rates, seller performance |
| Shipments + tracking | Shipping App | `GET /api/v1/shipments` | Core — delivery performance, fulfillment time |
| Shipping quotes | Shipping App | `POST /api/v1/shipping-quotes` | Supporting — cost analysis |
| Payments | Payments App | `GET /api/v1/payments` | Core — revenue, payment methods, success rate |
| Settlements | Payments App | `GET /api/v1/settlements` | Core — seller payouts, commission revenue |
| Payouts | Payments App | `GET /api/v1/payouts` | Supporting — payout timing |
| Refunds | Payments App | `GET /api/v1/refunds` | Core — refund rate, reason analysis |
| Receipts | Payments App | `GET /api/v1/receipts` | Supporting — fiscal compliance |
| Buyer profiles | Buyer App | `GET /api/v1/buyer/profile` | Core — customer count, acquisition |
| Favorites | Buyer App | `GET /api/v1/buyer/favorites` | Supporting — product interest proxy |
| Cart data | Buyer App | `GET /api/v1/buyer/cart` | Supporting — conversion funnel |
| Logistics operators | Shipping App | `GET /api/v1/logistics-operators` | Supporting — operational capacity |

> **Key Insight**: Data is federated across 4 apps with no centralized data warehouse. The Manager Dashboard must aggregate data via REST GET calls (read-only). No event bus exists for real-time synchronization.

---

## 6. Authentication Model (Clerk)

All apps share a single Clerk project. The Manager Dashboard needs:

| User | Required metadata | Dashboard Access |
|------|-------------------|-----------------|
| Admin | `publicMetadata.admin = true` | Full access |
| Manager | `publicMetadata.admin = true` | Full access (same as admin) |

Per the documentation, `admin` is a transversal role. A user with `publicMetadata.admin = true` can access all apps. The Manager Dashboard should follow the same pattern requiring `publicMetadata.admin = true`.

No new user roles are needed — the existing `admin` flag is sufficient.
