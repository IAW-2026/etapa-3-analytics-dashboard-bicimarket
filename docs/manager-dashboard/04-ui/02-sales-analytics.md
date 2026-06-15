# 4.2 — Sales Analytics

> **Manager Dashboard — UI Design**
>
> In-depth revenue and order analysis with breakdowns by seller, product, and time.

---

## Purpose

Allow marketing and executive users to explore revenue drivers — trends, seller rankings, product performance, and payment method analysis.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Sales Analytics                             [7d ▾] [30d ▾] [Cu▾] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Revenue  │ │ Orders   │ │ AOV      │ │ Growth   │               │
│ │ ARS 8.2M │ │ 1,245    │ │ ARS 52.5K│ │ +12% WoW │               │
│ │ ↑8% vs7d │ │ ↑5% vs7d │ │ ↑3% vs7d│ │          │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Revenue Over Time                              ┌────────────────┐  │
│ ┌────────────────────────────────────────┐    │ Compare:       │  │
│ │ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇█ │    │ [WoW ▾] [YoY ▾]│  │
│ │                                        │    │                │  │
│ │ [Area/Bar chart with period toggle]     │    │ Previous:      │  │
│ │                                        │    │ ARS 7.3M       │  │
│ └────────────────────────────────────────┘    │ Change: +12%   │  │
│                                               └────────────────┘  │
│                                                                     │
│ Revenue by Seller (Top 10)                  Revenue by Method      │
│ ┌────────────────────────────────────┐     ┌────────────────────┐  │
│ │ #  Seller       Rev       Trend    │     │ Credit Card  62%  │  │
│ │ ───────────────────────────────── │     │ MP           25%  │  │
│ │ 1  BiciSur    ARS 3.1M  ↑18% WoW │     │ Debit          8%  │  │
│ │ 2  BikeAR     ARS 1.8M  ↑5% WoW  │     │ Transfer       5%  │  │
│ │ 3  RodadosXX  ARS 0.9M  ↓3% WoW  │     └────────────────────┘  │
│ │ 4  Ciclos OK  ARS 0.6M  ↑22% WoW │                               │
│ │ 5  MTB House  ARS 0.4M  ↓8% WoW  │     Revenue by Category     │
│ └────────────────────────────────────┘     ┌────────────────────┐  │
│                                             │ MTB        45%    │  │
│ Revenue by Day of Week                      │ Parts      20%    │  │
│ ┌────────────────────────────────────────┐  │ Urban      15%    │  │
│ │ ▃▅▇▆▅▆▇                               │  │ Road       12%    │  │
│ │ Mon Tue Wed Thu Fri Sat Sun            │  │ Other       8%    │  │
│ └────────────────────────────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- Revenue (GMV), Order Count, AOV, Growth Rate
- **Data Source**: `GET /api/v1/payments`

### 2. Revenue Over Time Chart
- **Component**: `AreaChart` or `BarChart` (toggleable)
- **Granularity**: Daily/Weekly/Monthly tabs
- **Comparison**: Toggle to overlay previous period
- **Interaction**: Click date range to drill into detail

### 3. Revenue by Seller
- **Component**: `Table` with ranked rows
- **Columns**: Rank, Seller name, Revenue, Trend %, Market share bar
- **Data Source**: Settlements aggregated by `seller_profile_id`
- **Interaction**: Click seller row → navigates to Seller Analytics detail

### 4. Revenue by Payment Method
- **Component**: `PieChart` or `DonutChart`
- **Data Source**: `GET /api/v1/payments` grouped by `method`

### 5. Revenue by Category
- **Component**: `BarChart` horizontal
- **Data Source**: Cross-reference items_summary product_ids with product categories (requires Seller App)

### 6. Revenue by Day of Week
- **Component**: `BarChart`
- **Data Source**: Aggregated payment data with day-of-week extraction

## States

### Loading
- Skeleton cards for KPI row
- Shimmer placeholder for chart area

### Error
- "Could not load sales data. [Retry]"
- KPI cards show "—" instead of values
- Chart shows empty state with error message

### Empty
- "No sales data for this period. Try a different date range."
- Shown when period has no approved payments
