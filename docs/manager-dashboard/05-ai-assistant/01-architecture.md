# 5.1 — AI Assistant Architecture

> **Manager Dashboard — AI Assistant**
>
> Provider-agnostic architecture for the conversational AI Copilot using the Vercel AI SDK pattern.

---

## 1. Design Principles

| Principle | Rationale |
|-----------|-----------|
| **Provider-agnostic** | Abstract LLM provider via Vercel AI SDK `languageModel` interface — swap OpenAI, Anthropic, or open-source models without code changes |
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
│  │  • Message list   │    │  │           │  │                   │  │ │
│  │  • Streaming      │    │  │  Intent    │  │ • queryPayments   │  │ │
│  │  • Inline charts  │    │  │  Classifier│  │ • querySettlements│  │ │
│  │  • Suggested Qs   │    │  │           │  │ • queryRefunds    │  │ │
│  └──────────────────┘    │  └───────────┘  │ • queryOrders      │  │ │
│                          │                  │ • queryProducts    │  │ │
│  ┌──────────────────┐    │  ┌───────────┐  │ • queryShipments   │  │ │
│  │  Data Viz Layer   │    │  │LLM Provider│ │ • querySellers     │  │ │
│  │  (Recharts +      │    │  │(Vercel AI │  │ • queryBuyers      │  │ │
│  │   shadcn Table)   │    │  │   SDK)    │  │ • forecastRevenue  │  │ │
│  └──────────────────┘    │  └───────────┘  │ • detectAnomalies   │  │ │
│                          │                  │ • generateReport   │  │ │
│                          │                  └───────────────────┘  │ │
│                          └─────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     Server Actions / Route Handlers               │ │
│  │                                                                   │ │
│  │  • POST /api/ai/chat      — main streaming endpoint              │ │
│  │  • POST /api/ai/explain   — chart explanation                    │ │
│  │  • GET  /api/ai/forecast  — revenue forecast                     │ │
│  │  • POST /api/ai/report    — generate report                      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     REST GET to 4 Apps         │
              │                               │
              │  • Payments: /api/v1/payments │
              │  • Payments: /api/v1/settlements│
              │  • Payments: /api/v1/refunds  │
              │  • Payments: /api/v1/payouts  │
              │  • Buyer:    /api/v1/buyer/orders│
              │  • Seller:   /api/v1/products │
              │  • Seller:   /api/v1/sales-orders│
              │  • Shipping: /api/v1/shipments│
              └───────────────────────────────┘
```

---

## 3. Core Components

### 3.1 LLM Provider Abstraction

```typescript
// ai/provider.ts
import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"

// Configurable via environment variable
const provider = process.env.AI_PROVIDER ?? "openai"

const model = provider === "anthropic"
  ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-sonnet-4-20250514")
  : createOpenAI({ apiKey: process.env.OPENAI_API_KEY })("gpt-4o")
```

**Configuration** (`AI_PROVIDER` env var):

| Value | Model | Use Case |
|-------|-------|----------|
| `openai` | GPT-4o | Default — strong tool use, fast streaming |
| `anthropic` | Claude Sonnet 4 | Alternative — strong reasoning, longer context |

### 3.2 Tool Registry

Every tool follows a uniform signature:

```typescript
interface DashboardTool {
  name: string
  description: string
  parameters: z.ZodSchema
  execute: (args: unknown, context: ToolContext) => Promise<ToolResult>
}
```

**Registered tools:**

| Tool Name | Description | API Call |
|-----------|-------------|----------|
| `queryPayments` | Retrieve payments with date/method/status filters | `GET /api/v1/payments` |
| `querySettlements` | Retrieve settlements with filters | `GET /api/v1/settlements` |
| `queryRefunds` | Retrieve refunds with date/reason filters | `GET /api/v1/refunds` |
| `queryPayouts` | Retrieve payout records | `GET /api/v1/payouts` |
| `queryOrders` | Retrieve buyer orders (requires Buyer App endpoint) | `GET /api/v1/buyer/orders` |
| `queryProducts` | Retrieve product catalog | `GET /api/v1/products` |
| `querySalesOrders` | Retrieve sales orders per seller | `GET /api/v1/sales-orders` |
| `queryShipments` | Retrieve shipment tracking data | `GET /api/v1/shipments` |
| `querySellers` | List seller profiles | `GET /api/v1/seller-profiles` (ASSUMPTION) |
| `queryBuyers` | List buyer profiles | `GET /api/v1/admin/buyers` (ASSUMPTION) |
| `getRevenueInsights` | Compute revenue metrics over period | Aggregates payments internally |
| `detectAnomalies` | Detect statistical anomalies in data | Compares against rolling average |
| `forecastRevenue` | Generate revenue forecast | Time-series model or LLM-based |
| `generateChartData` | Format data for inline visualization | Transform step |

### 3.3 Intent Classifier

Before invoking the LLM, a lightweight classifier routes the query:

```typescript
type Intent =
  | "query"       // "How much revenue last week?"
  | "compare"     // "How does this week compare to last?"
  | "analyze"     // "Why did sales drop?"
  | "forecast"    // "Predict next month revenue"
  | "report"      // "Generate monthly report"
  | "explain"     // "Explain this chart"
  | "anomaly"     // "Any anomalies today?"
  | "whatif"      // "What if we raise commission to 12%?"
```

The classifier can be a simple prompt-based classification (fed to the LLM as the first system turn) or a separate small model for latency optimization.

### 3.4 Data Flow Per Query

```
User: "What was our revenue last week?"
           │
           ▼
    1. Intent Classification → "query"
           │
           ▼
    2. LLM generates tool call: queryPayments({ from: "2026-06-04", to: "2026-06-10" })
           │
           ▼
    3. Server executes tool → calls GET /api/v1/payments?from=...&to=...
           │
           ▼
    4. Results returned to LLM as tool output
           │
           ▼
    5. LLM generates human response with inline aggregation
    6. Response streamed to client via Vercel AI SDK
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
     │  ← stream: [tool_call] │ (client renders chart)   │
     │                         │                         │
```

**Key implementation details:**

- Use `streamText` from `ai` package with `maxSteps=5` for multi-turn tool calls
- Client uses `useChat` with `experimental_prepareRequestBody` to attach context (active dashboard filters)
- AbortController for cancellation on new query
- Tool calls are displayed as intermediate steps ("Fetching payment data...")

---

## 5. Context Management

| Strategy | Implementation |
|----------|---------------|
| **Windowed history** | Last N messages (configurable, default 20) sent with each request |
| **Token budget** | System prompt + conversation history must fit within model's context window; oldest messages pruned first |
| **Data freshness** | Tools always fetch fresh data — no cached context |
| **Active filters** | Current dashboard date range and filters sent as context |

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
| Cost control | Per-user rate limiting (60 req/min); max tokens per response configurable (default 2048) |
| Tool misuse | Tool parameters validated with Zod before execution |
| Sensitive data | No PII exposed in tool responses unless explicitly requested and user has admin role |

---

## 8. Technology Stack

| Component | Library |
|-----------|---------|
| AI SDK | `ai` (Vercel AI SDK) |
| Chat hook | `useChat` from `ai/react` |
| Streaming | `streamText` from `ai` |
| Schema validation | `zod` |
| LLM Providers | `@ai-sdk/openai`, `@ai-sdk/anthropic` |
| Embeddings | `@ai-sdk/openai` (text-embedding-3-small) or `@ai-sdk/anthropic` |
| Vector Store | In-memory or Vercel KV / Supabase pgvector |

---

## 9. Deployment Considerations

| Factor | Guidance |
|--------|----------|
| Edge vs Server | Use serverless functions (Node.js runtime) for tool execution; edge runtime for streaming only |
| Cold starts | Use provider streaming to start showing tokens immediately while tools execute |
| Cost optimization | Cache common queries (e.g., "daily revenue" for current day) with 5-min TTL |
| Monitoring | Log tool call count, latency per tool, token usage per session |
