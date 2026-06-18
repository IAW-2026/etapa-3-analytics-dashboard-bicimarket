# 3.3 — Product Metrics

> **Manager Dashboard — Metrics & KPIs**
>
> Detailed specification of product-related KPIs.

---

## P1 — Active Products Count

**Definition**: Number of products currently available for sale.

**Formula**: `COUNT(products WHERE status = active)`

**Data Source**: `GET /api/v1/products?status=active`

**Dashboard Widget**: KPI card with trend

**Priority**: P0

---

## P2 — Products by Category Distribution

**Definition**: Percentage breakdown of active products across categories.

**Formula**: `COUNT(products GROUP BY category) / COUNT(*) * 100`

**Data Source**: `GET /api/v1/products`

**Dashboard Widget**: Horizontal bar chart or treemap

**Priority**: P1

**Categories**: `mtb`, `road`, `urban`, `kids`, `bmx`, `parts`, `accessories`, `indumentaria`

---

## P3 — Products by Condition Distribution

**Definition**: Percentage breakdown of products by condition.

**Formula**: `COUNT(products GROUP BY condition) / COUNT(*) * 100`

**Data Source**: `GET /api/v1/products` — `condition` field

**Dashboard Widget**: Donut chart

**Priority**: P2

**Conditions**: `new`, `used_like_new`, `used_good`, `used_fair`

---

## P4 — Top Products by Revenue

**Definition**: Products generating the most revenue.

**Formula**:
```
Product Revenue = SUM(items.unit_price_cents × items.quantity)
                WHERE items.product_id = target_product
                FROM payments.items_summary
```

**Steps**:
1. Parse `items_summary` from all approved payments (JSON array of seller groups, each with an `items` array)
2. Extract individual items with `product_id`, `unit_price_cents`, `quantity`
3. Aggregate by `product_id`
4. Join with `GET /api/v1/products/{id}` for product names

**Source**: Payments (items_summary) + Seller (product names).

**Dashboard Widget**:
- Ranked table: Top 10 products
- Bar chart with product names
- Revenue trend per top product

---

## P5 — Top Products by Volume (Units Sold)

**Definition**: Products with the most units sold.

**Formula**:
```
Product Volume = SUM(items.quantity)
               WHERE items.product_id = target_product
               FROM payments.items_summary
```

**Source**: Payments items_summary. Same parsing approach as P4.

**Dashboard Widget**: Ranked table with units sold, separate from revenue ranking.

---

## P6 — Average Product Price

**Definition**: Average listed price of active products.

**Formula**: `AVG(products.price_cents)`

**Data Source**: `GET /api/v1/products`

**Dashboard Widget**: KPI card

**Priority**: P2

---

## P7 — Category Revenue Share

**Definition**: Revenue contribution of each product category as a percentage of total.

**Formula**: `SUM(payments per category) / SUM(all payments) * 100`

**Steps**:
1. Parse items_summary from all approved payments
2. Extract product_ids and calculate revenue per item
3. Map product_ids to categories via Seller App product data
4. Aggregate revenue by category
5. Calculate percentage of total

**Source**: Payments items_summary + Seller product categories.

**Dashboard Widget**: Donut chart + bar chart comparing category growth rates

**Priority**: P1

---

## P8 — Items per Order

**Definition**: Average number of product items per payment (across all sellers).

**Formula**: `AVG(items count across all seller groups in items_summary)`

**Data Source**: `GET /api/v1/payments` — count items across all sellers in items_summary

**Dashboard Widget**: KPI card

**Priority**: P2

---

## Product Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Product Analytics              [7d ▾] [30d ▾] [Custom ▾]     │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ Productos │ │ Precio   │ │ Items/   │ │ Categoría│          │
│ │ Activos   │ │ Promedio │ │ Orden    │ │ 8         │          │
│ │ 2,340     │ │ ARS 45K  │ │ 2.3      │ │          │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                │
│ Products by Category                     Top 10 Products       │
│ ┌────────────────────────────┐           ┌──────────────────┐  │
│ │ MTB         35% █████████  │           │ Trek Procaliber  │  │
│ │ Parts       20% █████      │           │ Specialized Rock│  │
│ │ Urban       15% ████       │           │ Shimano XT Set   │  │
│ │ Road        12% ███        │           │ ...              │  │
│ │ Accessories 10% ██         │           └──────────────────┘  │
│ │ Kids         5% █          │                                  │
│ │ BMX          2%            │                                  │
│ │ Indumentaria 1%            │                                  │
│ └────────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```
