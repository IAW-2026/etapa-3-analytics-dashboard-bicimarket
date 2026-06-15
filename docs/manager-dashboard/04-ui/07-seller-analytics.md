# 4.7 — Seller Analytics

> **Manager Dashboard — UI Design**
>
> Seller performance — rankings, settlements, product counts, and verification status.

---

## Purpose

Enable marketplace managers to monitor seller health, identify top performers, and spot sellers needing attention.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Seller Analytics                         [7d ▾] [30d ▾] [Cu▾] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Active   │ │ Pending  │ │ Avg.     │ │ Top      │               │
│ │ Sellers  │ │ Settle.  │ │ Revenue  │ │ Seller   │               │
│ │ 24       │ │ ARS 850K │ │ ARS 342K │ │ BiciSur  │               │
│ │ —        │ │ 12 sellers│ │ ↑5% MoM  │ │          │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Seller Ranking (by Revenue)                                         │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ # Seller     Revenue      Commission  Products  Accept Rate  │    │
│ │ ──────────────────────────────────────────────────────────── │    │
│ │ 1  BiciSur   ARS 3.1M    ARS 310K    245        98%         │    │
│ │ 2  BikeAR    ARS 1.8M    ARS 180K    189        95%         │    │
│ │ 3  RodadosXX ARS 0.9M    ARS 90K     156        88%         │    │
│ │ 4  Ciclos OK ARS 0.6M    ARS 60K     78         92%         │    │
│ │ 5  MTB House ARS 0.4M    ARS 40K     234        78%         │    │
│ │ 6  ...                                                       │    │
│ │                                                              │    │
│ │ [Click row to view seller detail ▸]                          │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
│ ┌────────────────────────────┐    ┌────────────────────────────┐   │
│ │ Seller Detail Panel        │    │ Seller Settlements         │   │
│ │ (on row click)             │    │ ────────────────────────── │   │
│ │ ────────────────────────── │    │ Seller     Pending   Paid  │   │
│ │ BiciSur                    │    │ BiciSur    ARS 120K  ARS   │   │
│ │ • Products: 245 active     │    │ BikeAR     ARS 80K   ARS   │   │
│ │ • Since: Jan 2025          │    │ RodadosXX  ARS 45K   ARS   │   │
│ │ • Verification: ✅ Verified│    │ Ciclos OK  ARS 20K   ARS   │   │
│ │ • Last active: Today       │    │ ...                       │   │
│ │ • Avg response: 2.4 hrs    │    │ [View Full Table ▸]       │   │
│ │                            │    └────────────────────────────┘   │
│ │ [Monthly revenue sparkline] │                                     │
│ └────────────────────────────┘                                     │
│                                                                     │
│ Seller Verification Status           Seller Product Count          │
│ ┌────────────────────────┐          ┌────────────────────────┐    │
│ │ ✅ Verified    20      │          │ [Bar chart: products   │    │
│ │ ⏳ Pending      2      │          │  per seller]           │    │
│ │ ❌ Suspended    1      │          │                        │    │
│ │ 📝 In Review    1      │          │                        │    │
│ └────────────────────────┘          └────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- Active sellers, pending settlement total, avg revenue per seller, top seller name
- **Data Source**: Settlements + Seller App

### 2. Seller Ranking Table
- **Component**: `Table` with sortable columns
- **Columns**: Rank, Seller name, Revenue, Commission, Products count, Acceptance rate
- **Data Source**: Cross-reference settlements + products + sales orders
- **Features**: Click row → expand detail panel

### 3. Seller Detail Panel
- **Component**: Slide-over panel or expandable section
- **Shows**: Profile info, product count, verification status, last active, revenue sparkline
- **Data Source**: Seller App + Payments

### 4. Seller Settlements Table
- **Component**: Condensed `Table`
- **Columns**: Seller name, Pending amount, Paid amount, Total
- **Data Source**: `GET /api/v1/settlements` grouped by seller

### 5. Verification Status
- **Component**: `DonutChart` + count breakdown
- **Data Source**: Seller App profiles

### 6. Seller Product Count
- **Component**: Horizontal `BarChart`
- **Data Source**: `GET /api/v1/products` grouped by seller

## States

### Loading
- Skeleton table rows
- Donut chart placeholder

### Error
- "Seller data unavailable. The Seller App may be down."
- Show settlement-derived data (revenue by seller from payments) as fallback

### Empty
- "No active sellers found."
- "No seller data for this period."

## Data Source Note

This screen depends on Seller App data. Without admin-level endpoints, seller listing may be incomplete. Revenue data from settlements (Payments App) provides a reliable fallback for the ranking table, but seller names and verification status require Seller App access.
