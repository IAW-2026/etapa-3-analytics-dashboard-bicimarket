# 1.3 — KPI Inventory

> **Manager Dashboard — System Analysis**
>
> A comprehensive inventory of all KPIs that can be derived from the documented system data, categorized by domain and time horizon.

---

## 1. How to Read This Document

Each KPI is documented with:

- **Name**: Short identifier
- **Category**: Domain area (Revenue, Operations, Finance, Customer, Product, Seller)
- **Type**: Operational (daily decisions) or Strategic (monthly/quarterly decisions)
- **Formula**: How it's calculated
- **Data Source**: Which app and which fields
- **Feasibility**: ✔️ Available | ⚠️ Needs cross-reference | ❌ Not available without assumptions
- **Dashboard Priority**: P0 (MVP must-have) | P1 (V2) | P2 (V3+)

---

## 2. Revenue KPIs

### R1 — Gross Merchandise Volume (GMV)

| Attribute | Value |
|-----------|-------|
| **Category** | Revenue |
| **Type** | Strategic |
| **Formula** | `SUM(payments.amount_cents) WHERE payments.status = approved` in a date range |
| **Data Source** | `GET /api/v1/payments` — `amount_cents`, `status`, `created_at` |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

### R2 — Daily Revenue

| Attribute | Value |
|-----------|-------|
| **Category** | Revenue |
| **Type** | Operational |
| **Formula** | `SUM(amount_cents) WHERE status=approved AND DATE(created_at) = target_date` |
| **Data Source** | `GET /api/v1/payments` |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

### R3 — Revenue by Seller

| Attribute | Value |
|-----------|-------|
| **Category** | Revenue |
| **Type** | Strategic |
| **Formula** | `SUM(settlements.gross_amount_cents) GROUP BY seller_profile_id` |
| **Data Source** | `GET /api/v1/settlements?sellerId=X` (must iterate sellers) |
| **Feasibility** | ⚠️ Medium — no endpoint to list all sellers with aggregated settlements |
| **Priority** | P1 |

### R4 — Average Revenue Per Order (ARPO)

| Attribute | Value |
|-----------|-------|
| **Category** | Revenue |
| **Type** | Operational |
| **Formula** | `AVG(payments.amount_cents) WHERE status=approved` |
| **Data Source** | `GET /api/v1/payments` |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

### R5 — Marketplace Commission Revenue

| Attribute | Value |
|-----------|-------|
| **Category** | Revenue |
| **Type** | Strategic |
| **Formula** | `SUM(settlements.fee_amount_cents) WHERE status=paid` |
| **Data Source** | `GET /api/v1/settlements` |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

### R6 — Effective Take Rate

| Attribute | Value |
|-----------|-------|
| **Category** | Revenue |
| **Type** | Strategic |
| **Formula** | `SUM(fee_amount_cents) / SUM(gross_amount_cents)` expressed as percentage |
| **Data Source** | `GET /api/v1/settlements` |
| **Feasibility** | ✔️ High (documented as 10% default) |
| **Priority** | P1 |

### R7 — Revenue Growth Rate

| Attribute | Value |
|-----------|-------|
| **Category** | Revenue |
| **Type** | Strategic |
| **Formula** | `(current_period_revenue - previous_period_revenue) / previous_period_revenue * 100` |
| **Data Source** | `GET /api/v1/payments` (compare time periods) |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

---

## 3. Order KPIs

### O1 — Total Orders

| Attribute | Value |
|-----------|-------|
| **Category** | Orders |
| **Type** | Operational |
| **Formula** | `COUNT(payments)` in a date range |
| **Data Source** | `GET /api/v1/payments` |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

### O2 — Orders per Day

| Attribute | Value |
|-----------|-------|
| **Category** | Orders |
| **Type** | Operational |
| **Formula** | `COUNT(payments WHERE DATE(created_at) = target_date)` |
| **Data Source** | `GET /api/v1/payments` |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

### O3 — Multi-Seller Order Rate

| Attribute | Value |
|-----------|-------|
| **Category** | Orders |
| **Type** | Strategic |
| **Formula** | `COUNT(payments WHERE items_summary.length > 1) / COUNT(*)` |
| **Data Source** | `GET /api/v1/payments` (items_summary contains per-seller breakdown) |
| **Feasibility** | ✔️ High |
| **Priority** | P2 |

### O4 — Payment Success Rate

| Attribute | Value |
|-----------|-------|
| **Category** | Orders |
| **Type** | Operational |
| **Formula** | `COUNT(payments WHERE status=approved) / COUNT(*) * 100` |
| **Data Source** | `GET /api/v1/payments` |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

### O5 — Payment Failure Rate by Reason

| Attribute | Value |
|-----------|-------|
| **Category** | Orders |
| **Type** | Operational |
| **Formula** | `COUNT(status=rejected GROUP BY reason) / COUNT(*) * 100` |
| **Data Source** | `GET /api/v1/payments` + `GET /api/v1/payment_attempts` (error_code) |
| **Feasibility** | ⚠️ Medium — requires joining payment attempts |
| **Priority** | P1 |

### O6 — Refund Rate

| Attribute | Value |
|-----------|-------|
| **Category** | Orders |
| **Type** | Operational |
| **Formula** | `COUNT(refunds WHERE status=approved) / COUNT(payments WHERE status=approved) * 100` |
| **Data Source** | `GET /api/v1/refunds` + `GET /api/v1/payments` |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

### O7 — Refund by Reason Distribution

| Attribute | Value |
|-----------|-------|
| **Category** | Orders |
| **Type** | Strategic |
| **Formula** | `COUNT(refunds GROUP BY reason)` |
| **Data Source** | `GET /api/v1/refunds` (reason field: `seller_rejected`, `buyer_cancelled`, `not_delivered`, `manual`) |
| **Feasibility** | ✔️ High |
| **Priority** | P1 |

---

## 4. Product KPIs

### P1 — Active Products Count

| Attribute | Value |
|-----------|-------|
| **Category** | Product |
| **Type** | Operational |
| **Formula** | `COUNT(products WHERE status=active)` |
| **Data Source** | `GET /api/v1/products` (with status=active filter) |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

### P2 — Products by Category Distribution

| Attribute | Value |
|-----------|-------|
| **Category** | Product |
| **Type** | Operational |
| **Formula** | `COUNT(products GROUP BY category) / COUNT(*) * 100` |
| **Data Source** | `GET /api/v1/products` |
| **Feasibility** | ✔️ High |
| **Priority** | P1 |

### P3 — Products by Condition Distribution

| Attribute | Value |
|-----------|-------|
| **Category** | Product |
| **Type** | Operational |
| **Formula** | `COUNT(products GROUP BY condition)` — values: `new`, `used_like_new`, `used_good`, `used_fair` |
| **Data Source** | `GET /api/v1/products` |
| **Feasibility** | ✔️ High |
| **Priority** | P2 |

### P4 — Top Products by Revenue

| Attribute | Value |
|-----------|-------|
| **Category** | Product |
| **Type** | Strategic |
| **Formula** | Sum of `unit_price_cents * quantity` across payments, grouped by `product_id` from `items_summary` |
| **Data Source** | Payments `items_summary` (JSON array of seller groups, each with `items` array) + Seller `products` for names |
| **Feasibility** | ⚠️ Medium — requires parsing `items_summary` JSON across all payments |
| **Priority** | P1 |

### P5 — Average Product Price

| Attribute | Value |
|-----------|-------|
| **Category** | Product |
| **Type** | Operational |
| **Formula** | `AVG(products.price_cents)` |
| **Data Source** | `GET /api/v1/products` |
| **Feasibility** | ✔️ High |
| **Priority** | P2 |

### P6 — Category Revenue Share

| Attribute | Value |
|-----------|-------|
| **Category** | Product |
| **Type** | Strategic |
| **Formula** | `SUM(payments per category) / SUM(all payments) * 100` |
| **Data Source** | Payments `items_summary` + Seller `products` category |
| **Feasibility** | ⚠️ Medium — requires joining product category data with payment items |
| **Priority** | P1 |

---

## 5. Operations KPIs

### OP1 — Fulfillment Rate

| Attribute | Value |
|-----------|-------|
| **Category** | Operations |
| **Type** | Operational |
| **Formula** | `COUNT(shipments WHERE status=delivered) / COUNT(shipments) * 100` |
| **Data Source** | `GET /api/v1/shipments?status=delivered` (if available) |
| **Feasibility** | ⚠️ Medium — no batch shipment list endpoint documented |
| **Priority** | P1 |

### OP2 — Average Delivery Time

| Attribute | Value |
|-----------|-------|
| **Category** | Operations |
| **Type** | Operational |
| **Formula** | `AVG(TIMESTAMPDIFF(DAY, shp.created_at, shp.delivered_at))` |
| **Data Source** | Shipping App (created_at + delivered_at from delivery_proofs) |
| **Feasibility** | ⚠️ Medium |
| **Priority** | P1 |

### OP3 — On-Time Delivery Rate

| Attribute | Value |
|-----------|-------|
| **Category** | Operations |
| **Type** | Operational |
| **Formula** | `COUNT(delivered WHERE actual_days <= estimated_days_max) / COUNT(delivered) * 100` |
| **Data Source** | Shipping quotes (estimated_days) + shipments (actual delivery) |
| **Feasibility** | ⚠️ Medium — requires quote-to-shipment matching |
| **Priority** | P2 |

### OP4 — Seller Acceptance Rate

| Attribute | Value |
|-----------|-------|
| **Category** | Operations |
| **Type** | Operational |
| **Formula** | `COUNT(sales_orders WHERE fulfillment_status=accepted) / COUNT(sales_orders) * 100` |
| **Data Source** | Seller App `GET /api/v1/sales-orders` |
| **Feasibility** | ⚠️ Medium — requires per-seller aggregation |
| **Priority** | P1 |

### OP5 — Pending Shipments (Backlog)

| Attribute | Value |
|-----------|-------|
| **Category** | Operations |
| **Type** | Operational |
| **Formula** | `COUNT(shipments WHERE status IN (ready_for_pickup, picked_up, in_transit))` |
| **Data Source** | Shipping App |
| **Feasibility** | ⚠️ Medium — no batch endpoint |
| **Priority** | P1 |

---

## 6. Finance KPIs

### F1 — Pending Settlement Value

| Attribute | Value |
|-----------|-------|
| **Category** | Finance |
| **Type** | Operational |
| **Formula** | `SUM(net_amount_cents) WHERE status=pending` |
| **Data Source** | `GET /api/v1/settlements?status=pending` |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

### F2 — Settlement Velocity (Days to Pay)

| Attribute | Value |
|-----------|-------|
| **Category** | Finance |
| **Type** | Operational |
| **Formula** | `AVG(TIMESTAMPDIFF(DAY, set.created_at, pst.completed_at))` |
| **Data Source** | Settlement + Payout timestamps |
| **Feasibility** | ✔️ High |
| **Priority** | P1 |

### F3 — Payout Volume

| Attribute | Value |
|-----------|-------|
| **Category** | Finance |
| **Type** | Operational |
| **Formula** | `SUM(settlement.net_amount_cents WHERE payout.status=completed)` |
| **Data Source** | `GET /api/v1/payouts` + settlement data |
| **Feasibility** | ✔️ High |
| **Priority** | P1 |

### F4 — Failed Settlement Rate

| Attribute | Value |
|-----------|-------|
| **Category** | Finance |
| **Type** | Operational |
| **Formula** | `COUNT(settlements WHERE status=failed OR manual_review) / COUNT(settlements) * 100` |
| **Data Source** | `GET /api/v1/settlements` |
| **Feasibility** | ✔️ High |
| **Priority** | P1 |

### F5 — Total Marketplace Revenue

| Attribute | Value |
|-----------|-------|
| **Category** | Finance |
| **Type** | Strategic |
| **Formula** | `SUM(settlements.fee_amount_cents) WHERE status=paid` |
| **Data Source** | `GET /api/v1/settlements` |
| **Feasibility** | ✔️ High |
| **Priority** | P0 |

---

## 7. Customer KPIs

### C1 — Total Buyers

| Attribute | Value |
|-----------|-------|
| **Category** | Customer |
| **Type** | Strategic |
| **Formula** | `COUNT(buyer_profiles)` |
| **Data Source** | Buyer App — **no documented endpoint for batch buyer count** |
| **Feasibility** | ❌ Low — ASSUMPTION: would need `GET /api/v1/admin/buyers` endpoint |
| **Priority** | P2 |

### C2 — New Buyers (Acquisition)

| Attribute | Value |
|-----------|-------|
| **Category** | Customer |
| **Type** | Strategic |
| **Formula** | `COUNT(buyer_profiles WHERE created_at IN period)` |
| **Data Source** | Buyer App — same as above |
| **Feasibility** | ❌ Low |
| **Priority** | P2 |

### C3 — Repeat Buyer Rate

| Attribute | Value |
|-----------|-------|
| **Category** | Customer |
| **Type** | Strategic |
| **Formula** | `COUNT(buyers with >1 order) / COUNT(buyers with >=1 order) * 100` |
| **Data Source** | Buyer App order history per buyer |
| **Feasibility** | ❌ Low |
| **Priority** | P2 |

### C4 — Payment Method Usage

| Attribute | Value |
|-----------|-------|
| **Category** | Customer |
| **Type** | Operational |
| **Formula** | `COUNT(payments GROUP BY method)` |
| **Data Source** | `GET /api/v1/payments` (method field) |
| **Feasibility** | ✔️ High |
| **Priority** | P1 |

---

## 8. Seller KPIs

### S1 — Active Sellers

| Attribute | Value |
|-----------|-------|
| **Category** | Seller |
| **Type** | Strategic |
| **Formula** | `COUNT(seller_profiles WHERE verification_status=verified)` |
| **Data Source** | Seller App — **no documented endpoint for batch seller list** |
| **Feasibility** | ❌ Low |
| **Priority** | P2 |

### S2 — Revenue per Seller (Ranking)

| Attribute | Value |
|-----------|-------|
| **Category** | Seller |
| **Type** | Strategic |
| **Formula** | `SUM(settlements.gross_amount_cents) GROUP BY seller_profile_id ORDER BY DESC` |
| **Data Source** | `GET /api/v1/settlements?sellerId=X` (must iterate) |
| **Feasibility** | ⚠️ Medium — requires calling endpoint per seller |
| **Priority** | P1 |

### S3 — Seller Settlement Value (Pending vs Paid)

| Attribute | Value |
|-----------|-------|
| **Category** | Seller |
| **Type** | Operational |
| **Formula** | `SUM(gross_amount_cents)` grouped by `settlement.status` per seller |
| **Data Source** | `GET /api/v1/settlements` |
| **Feasibility** | ✔️ High |
| **Priority** | P1 |

### S4 — Seller Product Count

| Attribute | Value |
|-----------|-------|
| **Category** | Seller |
| **Type** | Operational |
| **Formula** | `COUNT(products WHERE seller_profile_id=X AND status=active)` |
| **Data Source** | `GET /api/v1/products?seller_id=X` |
| **Feasibility** | ✔️ High |
| **Priority** | P2 |

---

## 9. KPI Dashboard Priority Matrix

### P0 — Must Have (MVP)

| KPI | Why |
|-----|-----|
| GMV (Revenue) | Core business metric |
| Daily/Weekly/Monthly Revenue | Time-series analysis |
| Payment Success Rate | Operational health |
| Total Orders (Volume) | Business scale |
| Average Order Value | Revenue quality |
| Pending Settlements Value | Financial liability tracking |
| Marketplace Commission Revenue | Business model validation |
| Revenue Growth Rate | Strategic trend |

### P1 — V2 (Advanced Analytics)

| KPI | Why |
|-----|-----|
| Revenue by Seller | Seller performance management |
| Refund Rate + Reasons | Quality control |
| Effective Take Rate | Business model monitoring |
| Fulfillment Rate | Operational efficiency |
| Average Delivery Time | Logistics quality |
| Seller Acceptance Rate | Marketplace health |
| Settlements Velocity | Seller experience |
| Failed Settlement Rate | Financial risk |
| Payment Method Usage | Product decisions |
| Category Revenue Share | Portfolio strategy |
| Top Products | Merchandising decisions |
| Seller Revenue Ranking | Partner management |

### P2 — V3+ (Advanced Insights)

| KPI | Why |
|-----|-----|
| Customer Acquisition Rate | Growth tracking |
| Repeat Buyer Rate | Retention metrics |
| Geographic Distribution | Expansion strategy |
| Products by Condition | Market composition |
| Multi-Seller Order Rate | Platform stickiness |
| On-Time Delivery Rate | Logistics SLA |
| New vs Returning Buyers | Customer lifecycle |
| Seller Product Count | Catalog health |
| Category Growth Rate | Trend spotting |
| Seasonal Sales Patterns | Planning |

---

## 10. Time-Based Aggregation Patterns

For every revenue/volume KPI, the dashboard should support:

| Granularity | Use Case |
|-------------|----------|
| Hourly | Real-time monitoring (today) |
| Daily | Short-term trends (7-30 days) |
| Weekly | Operational reviews |
| Monthly | Strategic reporting |
| Quarterly | Executive reviews |
| Yearly | Annual comparisons |
| Custom range | Ad-hoc analysis |

**Implementation note**: The `GET /api/v1/payments` endpoint supports `from` and `to` date filters, enabling client-side aggregation by any time period.
