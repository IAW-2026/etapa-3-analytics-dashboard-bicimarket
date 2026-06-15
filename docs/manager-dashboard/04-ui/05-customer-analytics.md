# 4.5 — Customer Analytics

> **Manager Dashboard — UI Design**
>
> Customer insights — acquisition, behavior, segmentation, and at-risk identification.

---

## Purpose

Provide customer-related insights: buyer counts, acquisition trends, repeat rates, and customer segments. Requires Buyer App admin endpoint (ASSUMPTION).

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Customer Analytics                       [7d ▾] [30d ▾] [Cu▾] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Total    │ │ New      │ │ Repeat   │ │ At-Risk  │               │
│ │ Buyers   │ │ Buyers   │ │ Rate     │ │ Buyers   │               │
│ │ 2,450    │ │ 120      │ │ 34%      │ │ 45       │               │
│ │ —        │ │ ↑8% MoM  │ │ ↑2% MoM  │ │ ⚠️ +12%  │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ Buyer Acquisition (Last 12 Months)                                  │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ ▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅▆▇███▇▆▅▆▇█                           │    │
│ │ [Bar chart: new buyers per month]                            │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
│ ┌────────────────────────────┐    ┌────────────────────────────┐   │
│ │ Customer Segments          │    │ At-Risk Buyers             │   │
│ │ ────────────────────────── │    │ ────────────────────────── │   │
│ │ Segment         Count      │    │ Buyer     Reason   Amount │   │
│ │ High Value       120       │    │ byr_001   Refund   ARS 45K│   │
│ │ Loyal (3+ buys)  340       │    │ byr_002   Failed   ARS 12K│   │
│ │ One-Time        1,200      │    │ byr_003   Refund   ARS 88K│   │
│ │ New (30d)         180      │    │ byr_004   Failed   ARS 5K │   │
│ │ Dormant (60d)     610      │    │ ...                       │   │
│ │                            │    │ [Contact Selected ▸]      │   │
│ │ [Donut chart of segments]  │    └────────────────────────────┘   │
│ └────────────────────────────┘                                     │
│                                                                     │
│ Payment Method Usage                      New vs Returning          │
│ ┌────────────────────────┐              ┌────────────────────────┐  │
│ │ Credit Card  62%      │              │  ▁▃▅▇▆▅▇███▇▆▅▆▇█     │  │
│ │ Mercado Pago 25%      │              │  [Stacked bar chart]   │  │
│ │ Debit Card    8%      │              │  ▓ New  ▓ Returning    │  │
│ │ Transfer      5%      │              │                        │  │
│ └────────────────────────┘              └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. KPI Cards
- Total buyers, new buyers, repeat rate, at-risk buyers
- **Data Source**: Buyer App (requires endpoint)

### 2. Buyer Acquisition Chart
- **Component**: `BarChart`
- **Data Source**: Buyer profiles created per month
- **Note**: Requires Buyer App admin endpoint

### 3. Customer Segments
- **Component**: `DonutChart` + segment table
- **Segments**: High Value, Loyal, One-Time, New, Dormant
- **Data Source**: Payment history grouped by `buyer_profile_id`

### 4. At-Risk Buyers
- **Component**: `Table`
- **Columns**: Buyer ID, Risk reason (refund/failed payment), Amount, Date
- **Data Source**: Cross-reference refunds + failed payments by buyer

### 5. Payment Method Usage
- **Component**: `PieChart`
- **Data Source**: `GET /api/v1/payments` grouped by `method`

### 6. New vs Returning
- **Component**: Stacked `BarChart`
- **Data Source**: Payments grouped by buyer + first-purchase detection

## States

### Loading
- Skeleton cards for all KPI numbers
- Chart placeholders

### Error
- "Customer data unavailable. The Buyer App may not have the required admin endpoint."
- Show payment method data only (available without Buyer App)

### Empty
- "No buyer data available for this period."
- "No at-risk buyers identified. Customer experience is healthy."

## Data Source Note

This screen depends heavily on a documented Buyer App admin endpoint. Without it, only Payment Method Usage (from Payments App) is available. All other widgets should show "Data not available — requires Buyer App admin endpoint."
