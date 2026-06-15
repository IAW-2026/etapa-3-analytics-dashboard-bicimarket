# 4.8 — AI Copilot Interface

> **Manager Dashboard — UI Design**
>
> The AI-powered chat interface that allows managers to explore data conversationally.

---

## Purpose

Provide a natural language interface for the dashboard where managers can ask questions, generate reports, analyze trends, and receive recommendations.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AI Copilot                                     │
│                        ┌─────────────┐                                │
│                        │ ✨ Ask me anything about your marketplace │  │
│                        │                                            │  │
│                        │ Suggested questions:                       │  │
│                        │ • "How was revenue this week?"             │  │
│                        │ • "Which seller performed best?"           │  │
│                        │ • "Show me pending settlements"            │  │
│                        │ • "Why did sales drop yesterday?"          │  │
│                        │ • "Forecast next month's revenue"          │  │
│                        │                                            │  │
│                        └────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ → "What was our revenue last week?"                            │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  Last week (Jun 04 - Jun 10) your marketplace generated:     │  │
│  │                                                              │  │
│  │  • Total Revenue: ARS 8.2M                                   │  │
│  │  • Orders: 156 (avg ARS 52.5K per order)                     │  │
│  │  • Growth: +12% vs previous week                             │  │
│  │                                                              │  │
│  │  Revenue trend for last week:                                │  │
│  │  ██▁▃▅▇▆▅▇███▇▆▅▆▇█▇▆▅                                     │  │
│  │  Mon Tue Wed Thu Fri Sat Sun                                 │  │
│  │                                                              │  │
│  │  Would you like me to break this down by seller or category? │  │
│  │                                                              │  │
│  │  [View Chart ↗]  [Export]  [Copy]                            │  │
│  │                                                              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ → "Yes, show me by seller"                                    │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  Revenue by Seller (Last Week):                               │  │
│  │                                                              │  │
│  │  1. BiciSur     ARS 3.1M  ████████████████████  (+18% WoW)   │  │
│  │  2. BikeAR      ARS 1.8M  ██████████            (+5% WoW)    │  │
│  │  3. RodadosXX   ARS 0.9M  █████                  (-3% WoW)   │  │
│  │  4. Ciclos OK   ARS 0.6M  ████                   (+22% WoW)  │  │
│  │  5. MTB House   ARS 0.4M  ██                      (-8% WoW)  │  │
│  │                                                              │  │
│  │  ⚡ Insight: Ciclos OK grew 22% — their best week yet.      │  │
│  │  ⚠️ RodadosXX declined 3% for the second week in a row.     │  │
│  │                                                              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ → [User types a question...]                                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  📎 Attach chart for AI analysis  [Send]                         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
```

## Interaction States

### Empty State
```
┌─────────────────────────────────────────────────────────────────┐
│  ✨ Hi! I'm your marketplace AI assistant.                      │
│                                                                  │
│  I can help you:                                                │
│  • 📊 Analyze revenue, orders, and trends                       │
│  • 💰 Review settlements, commissions, and payouts              │
│  • 🚚 Check operations and fulfillment status                   │
│  • 📈 Generate forecasts and predictions                        │
│  • 📄 Create reports and summaries                              │
│  • 🔍 Detect anomalies and unusual patterns                     │
│                                                                  │
│  Try asking: "What happened yesterday?" or "Show me top sellers"│
└─────────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────┐
│  ⏳ Analyzing your data...                                      │
│  ────▐▓▓▓▓▓░░░░░░░────  Fetching payment data...               │
│  ────▐▓▓▓▓▓▓▓░░░░░░───  Cross-referencing sellers...           │
│  ────▐▓▓▓▓▓▓▓▓▓▓░░░░───  Generating insights...                │
└─────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ I couldn't answer that question.                           │
│                                                                  │
│  Possible reasons:                                              │
│  • The data source might be unavailable                         │
│  • Your question might need data I don't have access to         │
│  • Try rephrasing your question                                 │
│                                                                  │
│  [Retry] [Try a different question]                             │
└─────────────────────────────────────────────────────────────────┘
```

## Widgets

### 1. Chat Message
- **Component**: Custom chat bubble (User: right-aligned, AI: left-aligned)
- Includes:
  - Text response with markdown formatting
  - Inline data visualizations (mini charts, tables)
  - Action buttons (View Chart, Export, Copy)
  - Suggested follow-up questions

### 2. Suggested Questions
- **Component**: Chip/pill buttons below empty state
- **Data Source**: Predefined list + dynamically generated based on available data

### 3. Chart Attachment
- **Component**: Button to attach current dashboard chart for AI analysis
- **Feature**: "Explain this chart" sends chart data to AI for interpretation

### 4. Data Visualizations (Inline)
- **Mini charts**: Compact Recharts components rendered within chat
- **Tables**: shadcn Table component for structured data
- **KPI numbers**: Formatted with currency/percentage

## Technical Implementation

- **Component**: `AICopilot` — floating panel or full-page view
- **State Management**: React state for messages, streaming for AI responses
- **Integration**: Vercel AI SDK (`useChat` hook) with streaming
- **Tools**: Custom tool definitions for each API endpoint (see Phase 5)

## Mobile

- Full-screen chat on mobile
- Triggered by floating action button
- Swipe to dismiss
