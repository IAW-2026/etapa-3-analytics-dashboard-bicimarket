# 4.6 — Product Analytics

> **Manager Dashboard — UI Design**
>
> Product performance — top sellers, category trends, catalog composition.

---

## Purpose

Help marketing managers understand which products and categories drive revenue, track catalog health, and identify trends.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Product Analytics                        [7d ▾] [30d ▾] [Cu▾] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Active   │ │ Avg      │ │ Items/   │ │ Categories│               │
│ │ Products │ │ Price    │ │ Order    │ │ 8        │               │
│ │ 2,340    │ │ ARS 45K  │ │ 2.3      │ │          │               │
│ │ ↑12% MoM │ │ ↓2% MoM  │ │ ↑5% MoM  │ │          │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Top 10 Products by Revenue                Top 10 Products by Volume│
│ ┌────────────────────────────────────┐   ┌──────────────────────┐  │
│ │ #  Product             Rev   Share │   │ #  Product     Units │  │
│ │ ───────────────────────────────── │   │ ─────────────────── │  │
│ │ 1  Trek Procaliber   ARS 3.1M 12%│   │ 1  Shimano Set   89  │  │
│ │ 2  Specialized Rock  ARS 2.2M  8%│   │ 2  Trek Proc.    45  │  │
│ │ 3  Shimano XT Set    ARS 1.8M  7%│   │ 3  Specialized   38  │  │
│ │ 4  Canyon Spectral  ARS 1.5M  6%│   │ 4  Canyon Spec.  32  │  │
│ │ 5  Giant Escape     ARS 1.2M  5%│   │ 5  Giant Escape   30  │  │
│ │ 6  ...                          │   │ 6  ...                │  │
│ └────────────────────────────────────┘   └──────────────────────┘  │
│                                                                     │
│ Revenue by Category                        Catalog Composition     │
│ ┌────────────────────────────┐           ┌──────────────────────┐  │
│ │ MTB         45% █████████  │           │ Condition   Count    │  │
│ │ Parts       20% █████      │           │ ─────────────────── │  │
│ │ Urban       15% ████       │           │ New          1,200   │  │
│ │ Road        12% ███        │           │ Used-Like New 450   │  │
│ │ Accessories  5% █          │           │ Used-Good     380   │  │
│ │ Kids         2%            │           │ Used-Fair     310   │  │
│ │ BMX          1%            │           │                     │  │
│ │ Indumentaria 0%            │           │ [Donut chart]       │  │
│ └────────────────────────────┘           └──────────────────────┘  │
│                                                                     │
│ Category Revenue Trend (Last 12 Months)                             │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇█                           │    │
│ │ [Multi-line chart: one line per top 3 categories]            │    │
│ └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- Active products, average price, items per order, categories count
- **Data Source**: `GET /api/v1/products`

### 2. Top Products by Revenue
- **Component**: `Table` with ranked rows
- **Columns**: Rank, Product name, Revenue, Market share bar
- **Data Source**: Payments items_summary cross-referenced with Seller products
- **Interaction**: Click product → show trend chart for that product

### 3. Top Products by Volume
- **Component**: `Table` (same format, sorted by units sold)
- **Data Source**: Same as above, sorted by quantity

### 4. Revenue by Category
- **Component**: Horizontal `BarChart`
- **Data Source**: Cross-reference products by category from payments

### 5. Catalog Composition
- **Component**: `DonutChart` (condition) + `BarChart` (category count)
- **Data Source**: `GET /api/v1/products`

### 6. Category Revenue Trend
- **Component**: Multi-line `LineChart`
- **Data Source**: Time-series revenue by top 3-5 categories

## States

### Loading
- Skeleton tables for top products
- Chart placeholders

### Error
- "Product data unavailable. Seller App may be down."
- Show payment-derived data only (without product names/categories)

### Empty
- "No products sold in this period."
- "Catalog is empty. No active products found."

## Data Source Note

Product revenue data requires parsing `items_summary` from payments and cross-referencing with Seller App product names/categories. If Seller App is unavailable, product IDs from payments can be shown without names.
