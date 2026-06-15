# 4.1 — Executive Overview

> **Manager Dashboard — UI Design**
>
> The primary landing page — a high-level snapshot of marketplace health.

---

## Purpose

Give executives a 10-second understanding of marketplace health with key metrics, trends, and attention items.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  BiciMarket Manager Dashboard                              Admin ▾│
│                                                                     │
│  Executive Overview  [7d ▾] [30d ▾] [90d ▾] [Custom ▾] [AI Brief]│
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ GMV      │ │ Orders   │ │ Success  │ │ Pending  │               │
│ │ ARS 8.2M │ │ 1,245    │ │ Rate     │ │ Settle.  │               │
│ │ ↑12% WoW │ │ ↑5% WoW  │ │ 94.2%    │ │ ARS 850K │               │
│ │          │ │          │ │ ↑0.5%    │ │ ⚠️ +15%  │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│  Revenue Trend (Last 30 Days)                 │  ┌────────────────┐│
│  ┌────────────────────────────────────────┐  │  │ Top Sellers     ││
│  │ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇█   │  │  │                ││
│  │                                        │  │  │ 1. BiciSur     ││
│  │ [Line chart with gradient area fill]    │  │  │ 2. BikeAR      ││
│  │                                        │  │  │ 3. RodadosXX   ││
│  └────────────────────────────────────────┘  │  │ 4. Ciclos OK   ││
│                                              │  │ 5. MTB House   ││
│  ┌────────────────────────────────────────┐  │  └────────────────┘│
│  │ Attention Items                         │  │                    │
│  │                                        │  │  ┌────────────────┐│
│  │ 🔴 Revenue 30% below avg (Jun 08)      │  │  │ AI Briefing     ││
│  │ ⚠️  15 orders pending seller acceptance │  │  │                ││
│  │ ⚠️  3 failed payouts today             │  │  │ Yesterday:      ││
│  │ ℹ️  Refund rate stable at 2.1%         │  │  │ ARS 1.2M rev    ││
│  └────────────────────────────────────────┘  │  │ 156 orders      ││
│                                              │  │ ↑12% WoW        ││
│  ┌────────────────────────────────────────┐  │  └────────────────┘│
│  │ Revenue by Day of Week                  │  │                    │
│  │ ▁▃▅▇▆▅▇                               │  │                    │
│  │ Mon Tue Wed Thu Fri Sat Sun            │  │                    │
│  └────────────────────────────────────────┘  │                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards (Top Row)
- **Component**: `KpiCard` with icon, value, label, trend arrow, sparkline
- **Data Source**: `GET /api/v1/payments` (aggregated)
- **Refresh**: 60s polling

### 2. Revenue Trend Chart (Main)
- **Component**: `AreaChart` from Recharts
- **Data Source**: `GET /api/v1/payments` with date grouping
- **Features**: Tooltip on hover, date range selector, period comparison toggle

### 3. Attention Items
- **Component**: Custom list with severity indicators (🔴/⚠️/ℹ️)
- **Data Source**: Computed from anomaly detection + thresholds
- **Features**: Click to navigate to detail, dismiss action

### 4. Top Sellers
- **Component**: `Table` (shadcn) or ranked list
- **Data Source**: `GET /api/v1/settlements` grouped by seller
- **Features**: Rank change indicator, revenue bar visualization

### 5. AI Briefing
- **Component**: Card with auto-generated text
- **Data Source**: AI summary of overnight activity
- **Features**: "Generate Briefing" button, auto-shown on first login

### 6. Revenue by Day of Week
- **Component**: `BarChart` (Recharts)
- **Data Source**: Aggregated payment data by day of week
- **Features**: Compare current vs previous period

## Empty State
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Welcome to the BiciMarket Manager Dashboard                 │
│                                                                  │
│  We're loading your data...                                      │
│                                                                  │
│  ────▐▓▓▓▓▓░░░░░░░────  Connecting to Payments App              │
│  ────▐▓▓▓▓▓▓▓░░░░░░───  Fetching settlements...                 │
└─────────────────────────────────────────────────────────────────┘
```

## Mobile
- 2-column KPI layout (instead of 4)
- Chart stacks below KPIs
- Attention items as collapsible section
- AI briefing as first card (collapsed by default)
