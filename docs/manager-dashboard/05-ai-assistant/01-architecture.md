# 5.1 — AI Assistant Architecture

> **Manager Dashboard — AI Assistant**
>
> Architecture for the conversational AI Copilot using the Vercel AI SDK pattern with Google Gemini.

---

## 1. Design Principles

| Principle | Rationale |
|-----------|-----------|
| **Provider-agnostic** | Abstract LLM provider via Vercel AI SDK `languageModel` interface — currently Gemini via `@ai-sdk/google`, swappable via `AI_MODEL` env var |
| **Tool-based data access** | AI never accesses databases directly — all data flows through registered tools wrapping REST GET endpoints |
| **Streaming-first** | Every response streams via `useChat` / `streamText` for low-latency UX |
| **Read-only** | Tools only perform GET operations — no mutations through the AI |
| **Observable** | Every tool call, token, and latency metric is logged for debugging and cost tracking |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Manager Dashboard (Next.js)                    │
│                                                                       │
│  ┌──────────────────┐    ┌─────────────────────────────────────────┐ │
│  │   AICopilot UI    │    │      AI Assistant Core                  │ │
│  │  (chat component) │────│                                        │ │
│  │                   │    │  ┌───────────┐  ┌───────────────────┐  │ │
│  │  • useChat hook   │    │  │  Router   │─→│ Tool Registry     │  │ │
│  │  • Message list   │    │  │           │  │  (12 tools)       │  │ │
│  │  • Streaming      │    │  │  Prompt-  │  │                   │  │ │
│  │  • Inline charts  │    │  │  based    │  │ • queryPayments   │  │ │
│  │  • Suggested Qs   │    │  │  Intent   │  │ • querySettlements│  │ │
│  └──────────────────┘    │  │  Classifier│  │ • queryRefunds    │  │ │
│                          │  └───────────┘  │ • getRevenueInsights│  │
│  ┌──────────────────┐    │  ┌───────────┐  │ • getCommission... │  │ │
│  │  Data Viz Layer   │    │  │LLM Provider│ │ • getPendingSet...│  │ │
│  │  (Recharts +      │    │  │(Gemini via │ │ • querySalesOrders│  │ │
│  │   shadcn Table)   │    │  │@ai-sdk/    │ │ • queryProducts   │  │ │
│  └──────────────────┘    │  │   google)  │ │ • querySellers    │  │ │
│                          │  └───────────┘  │ • queryBuyers     │  │ │
│                          │                  │ • forecastRevenue │  │ │
│                          │                  │ • generateChartData│  │ │
│                          │                  └───────────────────┘  │ │
│                          └─────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     Route Handlers                                │ │
│  │                                                                   │ │
│  │  • POST /api/ai/chat      — main streaming endpoint              │ │
│  │  • POST /api/ai/explain   — chart explanation                    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   REST GET to 3 Apps          │
              │                               │
              │  • Payments: /api/v1/payments/metrics
              │  • Payments: /api/v1/settlements/metrics
              │  • Payments: /api/v1/refunds/metrics
              │  • Payments: /api/v1/payments/revenue/timeseries
              │  • Seller:   /api/v1/sellers/metrics
              │  • Seller:   /api/v1/sales-orders/metrics
              │  • Buyer:    /api/v1/admin/buyers/metrics
              └───────────────────────────────┘
```

---

## 3. Core Components

### 3.1 LLM Provider

```typescript
// ai/provider.ts
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export function getModel() {
  const modelName = getEnv("AI_MODEL", "gemini-3.1-flash-lite-preview")
  return getProvider().languageModel(modelName)
}
```

**Configuration**:

| Env Var | Default | Description |
|---------|---------|-------------|
| `GOOGLE_API_KEY` | — | Google AI API key (required) |
| `AI_MODEL` | `gemini-3.1-flash-lite-preview` | Model name to use |

### 3.2 Tool Registry

Every tool follows a uniform signature using `dynamicTool` from Vercel AI SDK with Zod schema validation.

**Registered tools (12):**

| Tool Name | Description | API Call |
|-----------|-------------|----------|
| `queryPayments` | Metrics de pagos o listado paginado | `GET /api/v1/payments/metrics` or `GET /api/v1/payments` |
| `querySettlements` | Metrics de liquidaciones o listado paginado | `GET /api/v1/settlements/metrics` or `GET /api/v1/settlements` |
| `queryRefunds` | Metrics de reembolsos | `GET /api/v1/refunds/metrics` |
| `getRevenueInsights` | Serie temporal de ingresos | `GET /api/v1/payments/revenue/timeseries` |
| `getCommissionTimeSeries` | Evolución de comisiones | `GET /api/v1/settlements/commission/timeseries` |
| `getPendingSettlementsBySeller` | Liquidaciones pendientes por vendedor | `GET /api/v1/settlements/pending-by-seller` |
| `querySalesOrders` | Metrics de órdenes de venta | `GET /api/v1/sales-orders/metrics` |
| `queryProducts` | Metrics de productos | `GET /api/v1/products/metrics` |
| `querySellers` | Metrics de vendedores | `GET /api/v1/sellers/metrics` |
| `queryBuyers` | Metrics de compradores | `GET /api/v1/admin/buyers/metrics` |
| `forecastRevenue` | Proyección de ingresos futuros | LLM-based (uses revenue timeseries data) |
| `generateChartData` | Formatear datos para visualización inline | Transform step |

### 3.3 Intent Classification

Before invoking the LLM, a lightweight prompt-based classifier identifies the user's intent as the first system turn:

```typescript
type Intent =
  | "query"       // "How much revenue last week?"
  | "compare"     // "How does this week compare to last?"
  | "analyze"     // "Why did sales drop?"
  | "forecast"    // "Predict next month revenue"
  | "explain"     // "Explain this chart"
  | "whatif"      // "What if we raise commission to 12%?"
  | "rootcause"   // "Investigate why sales dropped"
```

The classifier is a prompt injected before the main system prompt that asks the LLM to classify the intent and respond with it in a structured format.

### 3.4 Data Flow Per Query

```
User: "What was our revenue last week?"
           │
           ▼
    1. Intent Classification → "query"
           │
           ▼
    2. RAG retrieval: embed query, search KPI definitions, inject context
           │
           ▼
    3. LLM generates tool call: queryPayments({ from: "2026-06-04", to: "2026-06-10" })
           │
           ▼
    4. Server executes tool → calls GET /api/v1/payments/metrics?from=...&to=...
           │
           ▼
    5. Results returned to LLM as tool output
           │
           ▼
    6. LLM generates human response with inline aggregation
    7. Response streamed to client via Vercel AI SDK
           │
           ▼
    "Last week (Jun 04-10) your marketplace generated ARS 8.2M across 156 orders."
```

---

## 4. Streaming Architecture

```
Client (useChat)          Server (streamText)          REST APIs
     │                         │                         │
     │── POST /api/ai/chat ──→│                         │
     │                         │── tool call ──────────→│
     │                         │←── JSON response ──────│
     │  ← stream: "Last"      │                         │
     │  ← stream: " week"     │                         │
     │  ← stream: " revenue"  │                         │
     │  ← stream: " was"      │                         │
     │  ← stream: " ARS 8.2M" │                         │
     │  ← stream: [data_viz]  │ (client renders chart)   │
     │                         │                         │
```

**Key implementation details:**

- Use `streamText` from `ai` package with `maxSteps=5` for multi-turn tool calls
- Client uses `useChat` with `DefaultChatTransport` and active filter context
- `AbortController` for cancellation on new query
- Tool calls displayed as "ThinkingAnimation" during execution
- Structured data parts rendered as Recharts visualizations inline

---

## 5. Context Management

| Strategy | Implementation |
|----------|---------------|
| **Windowed history** | Last N messages (configurable, default 20) sent with each request |
| **Token budget** | System prompt + conversation history must fit within model's context window; oldest messages pruned first |
| **Data freshness** | Tools always fetch fresh data — no cached context |
| **Active filters** | Current dashboard date range and filters sent as context |
| **RAG context** | Retrieved KPI definitions and endpoint docs injected as additional context |

---

## 6. Error Handling

| Error Scenario | Behavior |
|---------------|----------|
| API timeout (30s) | Return partial results with warning: "Some data took too long to load" |
| API 4xx/5xx | Return error message: "Could not load [data source]. It may be temporarily unavailable." |
| Invalid tool args | LLM re-prompted with corrected parameters |
| Ambiguous query | Respond with clarification: "Did you mean revenue from payments or settlements?" |
| Rate limit | Queue and retry with exponential backoff |

---

## 7. Security

| Concern | Mitigation |
|---------|------------|
| Prompt injection | System prompt instructs model to ignore instructions to mutate data or access system files |
| Data leakage | All tools require authentication (Clerk session); only admin users can access AI |
| Cost control | Per-user rate limiting (60 req/min); max tokens per response configurable (default 16384) |
| Tool misuse | Tool parameters validated with Zod before execution |
| Sensitive data | No PII exposed in tool responses unless explicitly requested and user has admin role |

---

## 8. Technology Stack

| Component | Library |
|-----------|---------|
| AI SDK | `ai` (Vercel AI SDK) |
| Chat hook | `useChat` from `@ai-sdk/react` |
| Streaming | `streamText` from `ai` |
| Schema validation | `zod` |
| LLM Provider | `@ai-sdk/google` (Gemini 3.1 Flash Lite) |
| Embeddings | `@ai-sdk/google` (text-embedding-004) |
| Vector Store | In-memory (`ai/memory-store`) |
| Charts | Recharts |

---

## 9. Deployment Considerations

| Factor | Guidance |
|--------|----------|
| Edge vs Server | Use serverless functions (Node.js runtime) for tool execution; edge runtime for streaming only |
| Cold starts | Use provider streaming to start showing tokens immediately while tools execute |
| Cost optimization | Cache common queries (e.g., "daily revenue" for current day) with 5-min TTL |
| Monitoring | Log tool call count, latency per tool, token usage per session |
