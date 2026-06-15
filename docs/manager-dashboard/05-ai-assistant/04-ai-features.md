# 5.4 — AI Features

> **Manager Dashboard — AI Assistant**
>
> Detailed specification of all AI-powered features, their data requirements, implementation approach, and priority.

---

## 1. Feature Overview

| # | Feature | Priority | Complexity | Use Case Reference |
|---|---------|----------|------------|-------------------|
| F1 | Natural Language Query | P0 | Medium | UC1, UC2, UC3, UC5, UC8 |
| F2 | Chart Explanation | P0 | Low | UC11 |
| F3 | Proactive Anomaly Detection | P1 | High | UC10 |
| F4 | Revenue Forecasting | P1 | High | UC9 |
| F5 | Weekly Briefing (Auto-generated) | P1 | Medium | UC1 (extended) |
| F6 | What-If Analysis | P2 | Low | UC12 |
| F7 | Scheduled Report Generation | P2 | Medium | UC14 |
| F8 | Automated Root Cause Analysis | P2 | High | UC2 (deep) |
| F9 | Customer Segmentation | P3 | High | UC13 |
| F10 | Meeting Mode | P3 | Medium | UC15 |

---

## 2. Feature Details

### F1 — Natural Language Query

**Priority**: P0 (MVP)
**Complexity**: Medium
**Dependencies**: Tool registry, LLM provider, all core REST endpoints

**Description**: Users ask business questions in plain language and receive data-backed answers with inline visualizations.

**Supported question types:**

| Category | Examples | Tools Used |
|----------|----------|------------|
| Revenue | "How much did we make yesterday?" | queryPayments |
| Comparison | "Is revenue up or down this week?" | queryPayments (compare periods) |
| Breakdown | "Show me revenue by seller" | querySettlements |
| Product | "What are our top products?" | queryPayments + queryProducts |
| Operations | "How many orders are pending?" | querySalesOrders + queryShipments |
| Financial | "What's our pending settlement liability?" | querySettlements (status=pending) |

**Implementation**:

```typescript
// Route handler
export async function POST(req: Request) {
  const { messages, activeFilters } = await req.json()

  const result = streamText({
    model,
    system: baseSystemPrompt,
    tools: toolRegistry,
    messages,
    maxSteps: 5,
    onStepFinish: logToolCall,
  })

  return result.toDataStreamResponse()
}
```

**Edge cases**:
- Ambiguous date: "last week" → resolve to Mon-Sun of previous week
- Ambiguous metric: "revenue" → prefer payment amount_cents (R1)
- Multi-intent query: "Show me revenue and top sellers" → chain tool calls

---

### F2 — Chart Explanation

**Priority**: P0 (MVP)
**Complexity**: Low
**Dependencies**: None (operates on client-side data)

**Description**: User clicks "Explain this chart" on any dashboard visualization and receives an AI-generated analysis of the chart's data.

**Implementation**:

```typescript
// Client: when user clicks "Explain this chart"
const chartData = extractChartData(chartRef) // { labels, values, series }

// Server: POST /api/ai/explain
const result = streamText({
  model,
  system: chartExplanationPrompt,
  messages: [
    { role: "user", content: `Explain this chart:\n${JSON.stringify(chartData)}` }
  ]
})
```

**Data sent to AI**:
- Chart type (line, bar, pie, area)
- Labels (dates, categories)
- Values (numerical series)
- Previous period comparison data (if available)

**UI integration**: "Explain" button on every chart component triggers this feature.

---

### F3 — Proactive Anomaly Detection

**Priority**: P1 (V2)
**Complexity**: High
**Dependencies**: Background polling infrastructure, historical data accumulation

**Description**: The system continuously monitors key metrics and surfaces anomalies as notifications or in-chat alerts.

**Monitored metrics**:

| Metric | Baseline | Check Frequency |
|--------|----------|-----------------|
| Payment volume (hourly) | Rolling 7-day hourly average | Every hour |
| Payment success rate | Rolling 7-day rate | Every 15 minutes |
| Order volume | Rolling 7-day daily average | Every hour |
| Refund rate | Rolling 7-day rate | Every hour |
| Settlement volume | Rolling 7-day daily average | Daily |

**Implementation approach**:

```typescript
// Background job (Vercel Cron or similar)
async function checkAnomalies() {
  const metrics = [
    { name: "payment_volume", fn: getHourlyPaymentVolume },
    { name: "success_rate", fn: getPaymentSuccessRate },
    { name: "order_volume", fn: getOrderVolume },
    { name: "refund_rate", fn: getRefundRate },
  ]

  for (const metric of metrics) {
    const current = await metric.fn("today")
    const baseline = await metric.fn("last_7_days_avg")
    const anomaly = detectAnomaly(current, baseline)

    if (anomaly) {
      await createNotification({
        type: "anomaly",
        metric: metric.name,
        severity: anomaly.severity,
        message: `${metric.name} is ${anomaly.direction} by ${anomaly.percent}%`
      })
    }
  }
}
```

**Statistical method**: Z-score with rolling window (window = 7 days for daily, 168 hours for hourly). Threshold: |z| > 2 for flagging, |z| > 3 for high severity.

**Presentation**: In-app notification bell + optional email digest. When user clicks, opens Copilot with pre-filled analysis.

---

### F4 — Revenue Forecasting

**Priority**: P1 (V2)
**Complexity**: High
**Dependencies**: Minimum 3 months of historical payment data

**Description**: Generate revenue forecasts using time-series analysis of historical payment data.

**Approach**: Two-tier strategy

| Tier | Method | Accuracy | Use Case |
|------|--------|----------|----------|
| Quick | LLM-based naive forecast (same-period-last-year + growth rate) | ±20% | Ad-hoc "what do you expect next month?" |
| Accurate | Statistical model (e.g., Prophet, ARIMA) run as server-side job | ±10% | Monthly reporting, board prep |

**LLM-based forecast implementation**:

```typescript
const historicalData = await queryPayments({ from: "-12 months", to: "today" })

const result = streamText({
  model,
  system: forecastPrompt,
  messages: [
    { role: "user", content: `Based on this 12-month payment data, forecast next 30 days:\n${JSON.stringify(historicalData)}` }
  ],
  tools: {
    // Allow LLM to request additional data if needed
    queryPayments: paymentTool
  }
})
```

**Output format**:
- Expected daily revenue range (low, medium, high scenarios)
- Confidence intervals (80% CI)
- Seasonal patterns noted
- Key assumptions listed

---

### F5 — Weekly Briefing

**Priority**: P1 (V2)
**Complexity**: Medium
**Dependencies**: All core endpoints, briefing system prompt

**Description**: Auto-generated weekly summary of marketplace performance, delivered on Monday morning (or on demand).

**Trigger points**:
1. Manual: User clicks "Generate briefing" in AI Copilot
2. Automatic: On first login Monday-Friday after 8 AM (if no briefing seen today)
3. Scheduled: Email delivery every Monday at 9 AM (V2+)

**Data collected**:

```typescript
async function collectBriefingData() {
  const [payments, settlements, refunds, shipments, salesOrders] = await Promise.all([
    queryPayments({ from: "yesterday-7d", to: "yesterday" }),
    querySettlements({ status: "pending" }),
    queryRefunds({ from: "yesterday-7d", to: "yesterday" }),
    queryShipments({ status: "in_transit" }),
    querySalesOrders({ status: "pending" }),
  ])
  return { payments, settlements, refunds, shipments, salesOrders }
}
```

**Caching**: Briefing data is cached for 15 minutes after generation. If user reopens within 15 min, cached version is shown.

---

### F6 — What-If Analysis

**Priority**: P2 (V3)
**Complexity**: Low
**Dependencies**: Settlement data, what-if prompt

**Description**: Simulate changes to marketplace parameters (commission rate, fees) and see projected financial impact.

**Supported scenarios**:

| Scenario | Input | Calculation |
|----------|-------|-------------|
| Change commission rate | New rate (%) | Recalculate all settlements with new rate |
| Change flat fee | New fee (ARS) | Add/reduce flat fee per settlement |
| Free shipping promotion | Discount (%) | Estimate impact on GMV (requires assumption) |

**Implementation**:

```typescript
async function whatIfCommission(newRate: number) {
  const settlements = await querySettlements({ status: "paid", from: "-3 months" })

  let currentTotalFees = 0
  let newTotalFees = 0

  for (const s of settlements) {
    currentTotalFees += s.fee_amount_cents
    const currentRate = s.fee_amount_cents / s.gross_amount_cents
    newTotalFees += Math.round(s.gross_amount_cents * newRate)
  }

  return {
    currentTotalFees,
    newTotalFees,
    difference: newTotalFees - currentTotalFees,
    percentChange: ((newTotalFees - currentTotalFees) / currentTotalFees * 100).toFixed(1),
    disclaimer: "This is a simulation based on historical data. Actual results may vary."
  }
}
```

**Limitations**: Cannot predict behavioral changes (e.g., sellers leaving due to higher commission). Clearly disclaimed in output.

---

### F7 — Scheduled Report Generation

**Priority**: P2 (V3)
**Complexity**: Medium
**Dependencies**: Report generation prompt, PDF library, email service

**Description**: Automatically generate and deliver periodic reports (weekly/monthly) in PDF format.

**Schedule options**:

| Frequency | Day/Time | Content |
|-----------|----------|---------|
| Daily | 9 AM | Yesterday's KPIs (brief) |
| Weekly | Monday 9 AM | Last week performance (detailed) |
| Monthly | 1st of month 9 AM | Full monthly financial report (most detailed) |

**Delivery**: In-app notification + email attachment (V2+)

**Tech stack for PDF**: `@react-pdf/renderer` or Puppeteer-based HTML-to-PDF

---

### F8 — Root Cause Analysis

**Priority**: P2 (V3)
**Complexity**: High
**Dependencies**: Historical data (> 3 months), anomaly detection

**Description**: When a metric drops or spikes, the AI automatically investigates correlated metrics to suggest likely causes.

**Investigation tree for "sales dropped"**:

```
1. Check payment success rate → if down, investigate payment gateway
2. Check order volume → if down, check seller acceptance rate
3. Check average order value → if down, check product mix
4. Check refund rate → if up, investigate recent refunds
5. Check seller activity → if top seller inactive, flag
6. Compare to same day last week → seasonal pattern?
```

**Implementation**: Multi-step tool chain where the LLM explores one hypothesis at a time, reporting findings as it goes.

---

### F9 — Customer Segmentation

**Priority**: P3 (V4)
**Complexity**: High
**Dependencies**: Buyer App batch endpoint (ASSUMPTION), payment history grouped by buyer

**Description**: Automatically segment buyers based on purchase behavior.

**Segments**:

| Segment | Criteria | Data Needed |
|---------|----------|-------------|
| High Value | Top 20% by total spend | Payments by buyer_profile_id |
| At Risk | Had refund or failed delivery | Refunds + shipments by buyer |
| New | First purchase < 30 days ago | First payment date per buyer |
| Dormant | No purchase in 60+ days | Last payment date per buyer |
| One-Time | Exactly 1 purchase | Payment count = 1 per buyer |
| Loyal | 3+ purchases | Payment count >= 3 per buyer |

**ASSUMPTION**: Customer segmentation requires a `GET /api/v1/admin/buyers` endpoint or equivalent that exposes buyer IDs, which is not documented in the current system.

---

### F10 — Meeting Mode

**Priority**: P3 (V4)
**Complexity**: Medium
**Dependencies**: All features above (F1-F9)

**Description**: Prepares a comprehensive board-ready presentation packet with talking points, charts, and strategic recommendations.

**Output**:
- Executive summary (1 page)
- Key metrics dashboard snapshot
- Performance vs targets (when targets are configured)
- Strategic insights (top 3 opportunities, top 3 risks)
- Appendix with detailed charts
- Exportable to PDF

---

## 3. Feature Roadmap by Phase

| Phase | Features |
|-------|----------|
| **MVP** | F1 (Natural Language Query), F2 (Chart Explanation) |
| **V2** | F3 (Anomaly Detection), F4 (Forecasting), F5 (Weekly Briefing) |
| **V3** | F6 (What-If), F7 (Scheduled Reports), F8 (Root Cause Analysis) |
| **V4** | F9 (Customer Segmentation), F10 (Meeting Mode) |

---

## 4. Interactions with Existing Dashboard

| Dashboard Feature | AI Copilot Integration |
|-------------------|----------------------|
| Date range filter | Shared context — AI uses active filter as default scope |
| Chart component | "Explain this chart" button sends chart data to AI |
| KPI card | Click opens Copilot with "Tell me more about [KPI]" |
| Table row | Right-click → "Analyze this seller/buyer" in Copilot |
| Notification | Click opens Copilot with anomaly context pre-loaded |
