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
| F4 | Revenue Forecasting | P1 | Medium | UC9 |
| F6 | What-If Analysis | P2 | Low | UC12 |
| F8 | Root Cause Analysis | P2 | Medium | UC2 (deep) |

---

## 2. Feature Details

### F1 — Natural Language Query

**Priority**: P0 (MVP)
**Complexity**: Medium
**Dependencies**: Tool registry, LLM provider, all core REST endpoints, RAG pipeline

**Description**: Users ask business questions in plain language and receive data-backed answers with inline visualizations.

**Supported question types:**

| Category | Examples | Tools Used |
|----------|----------|------------|
| Revenue | "How much did we make yesterday?" | queryPayments, getRevenueInsights |
| Comparison | "Is revenue up or down this week?" | queryPayments (compare periods) |
| Breakdown | "Show me revenue by seller" | querySettlements |
| Product | "What are our top products?" | queryPayments + queryProducts |
| Operations | "How many orders are pending?" | querySalesOrders |
| Financial | "What's our pending settlement liability?" | querySettlements (status=pending) |

**Architecture**:

```text
User query
  -> Prompt-based intent classifier (query/compare/analyze/forecast/whatif/explain/rootcause)
  -> RAG retrieval: embed query, search KPI definitions + endpoint docs, inject context
  -> streamText({ model, tools, system, messages, maxSteps: 5, onStepFinish: logToolCall })
  -> tools ejecutan getServiceJson(app, path)
  -> Response streaming al cliente con markdown + structured data parts para gráficos inline
```

**Components**:
1. **Tool registry**: 12 tools (queryPayments, querySettlements, queryRefunds, getRevenueInsights, getCommissionTimeSeries, getPendingSettlementsBySeller, querySalesOrders, queryProducts, querySellers, queryBuyers, forecastRevenue, generateChartData)
2. **RAG pipeline**: chunker (512 tokens, 64 overlap), in-memory vector store, query rewriter, top-5 retrieval
3. **Intent classifier**: prompt-based classification as first system turn
4. **Inline visualizations**: structured data parts rendered as Recharts components in chat
5. **Active filters context**: dashboard date range + filters passed to AI via useChat

**Edge cases**:
- Ambiguous date: "last week" → resolve to Mon-Sun of previous week
- Ambiguous metric: "revenue" → prefer payment amount_cents
- Multi-intent query: "Show me revenue and top sellers" → chain tool calls via maxSteps

---

### F2 — Chart Explanation

**Priority**: P0 (MVP)
**Complexity**: Low
**Dependencies**: None (operates on client-side data)

**Description**: User clicks "Explain this chart" on any dashboard visualization and receives an AI-generated analysis of the chart's data.

**Implementation**:

```typescript
// Client: when user clicks "Explain this chart"
const chartData = extractChartData(chartRef) // { chartType, labels, values, series }

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

### F4 — Revenue Forecasting

**Priority**: P1 (V2)
**Complexity**: Medium
**Dependencies**: Minimum 3 months of historical payment data

**Description**: Generate revenue forecasts using time-series analysis of historical payment data.

**Approach**: LLM-based naive forecast using existing revenue timeseries data.

```typescript
const historicalData = await getServiceJson("payments", "/api/v1/payments/revenue/timeseries?from=-12months&to=today")

// The forecastRevenue tool wraps this and presents data to the LLM
// The LLM identifies trends, seasonality, and projects forward
```

**Output format**:
- Expected daily revenue range (low, medium, high scenarios)
- Confidence intervals
- Seasonal patterns noted
- Key assumptions listed

**Prompt**: Forecasting system prompt instructs the model to gather historical data, identify trends, and project forward with confidence bounds.

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

**Implementation**:

```typescript
async function simulateCommissionChange(newRate: number) {
  const settlements = await getServiceJson("payments", "/api/v1/settlements?status=paid&limit=1000")

  let currentTotalFees = 0
  let newTotalFees = 0

  for (const s of settlements) {
    currentTotalFees += s.fee_amount_cents
    newTotalFees += Math.round(s.gross_amount_cents * newRate)
  }

  return {
    currentTotalFees,
    newTotalFees,
    difference: newTotalFees - currentTotalFees,
    percentChange: ((newTotalFees - currentTotalFees) / currentTotalFees * 100).toFixed(1),
    disclaimer: "Esta es una simulación basada en datos históricos. Los resultados reales pueden variar."
  }
}
```

**Limitations**: Cannot predict behavioral changes (e.g., sellers leaving due to higher commission). Clearly disclaimed in output.

---

### F8 — Root Cause Analysis

**Priority**: P2 (V3)
**Complexity**: Medium
**Dependencies**: Historical data (> 3 months), multi-step tool chaining via maxSteps

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

**Implementation**: Multi-step tool chain where the LLM explores one hypothesis at a time using maxSteps, reporting findings as it goes. Each step calls relevant tools and the model decides the next investigation path based on results.

---

## 3. Feature Roadmap by Phase

| Phase | Features |
|-------|----------|
| **V1** | F1 (Natural Language Query) — complete with RAG, inline viz, intent classifier, 12 tools |
| **V2** | F2 (Chart Explanation), F4 (Revenue Forecasting) |
| **V3** | F6 (What-If Analysis), F8 (Root Cause Analysis) |

---

## 4. Interactions with Existing Dashboard

| Dashboard Feature | AI Copilot Integration |
|-------------------|----------------------|
| Date range filter | Shared context — AI uses active filter as default scope |
| Chart component | "Explain this chart" button sends chart data to AI |
| KPI card | Click opens Copilot with "Tell me more about [KPI]" |
| Table row | Right-click → "Analyze this seller/buyer" in Copilot |
