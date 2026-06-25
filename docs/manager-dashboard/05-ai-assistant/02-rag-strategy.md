# 5.2 — RAG Strategy

> **Manager Dashboard — AI Assistant**
>
> Retrieval-Augmented Generation approach for grounding AI responses in business context, KPI definitions, and system knowledge.

---

## 1. Why RAG (Not Fine-Tuning)

| Factor | RAG | Fine-Tuning |
|--------|-----|-------------|
| KPI definitions change | Update document, no retrain | Requires re-tuning |
| New metrics added | Add document, no retrain | Requires re-tuning |
| Cost | Pay per token | Upfront training cost |
| Correctness | Grounded in source docs | Can hallucinate definitions |
| Update frequency | Instant | Hours-days |

RAG is the correct choice for this use case — KPI definitions, business rules, and metric formulas evolve as the marketplace grows.

---

## 2. Documents to Index

| Document | Content | Priority | Update Frequency |
|----------|---------|----------|-----------------|
| KPI definitions (03-kpi-inventory.md) | Formula, source, priority for each KPI | High | Per release |
| System data map (02-system-data-map.md) | Available endpoints, field descriptions | High | Per API change |
| Use cases (03-use-cases.md) | Example queries, expected responses | Medium | Per feature |
| UI designs (04-ui/*.md) | Screen descriptions, chart types | Low | Per UI change |
| Metric formulas (03-metrics/*.md) | Detailed per-domain metric docs | High | Per release |

---

## 3. Chunking Strategy

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Chunk size | 512 tokens | Small enough for precise retrieval, large enough for complete definitions |
| Chunk overlap | 64 tokens | Prevent context loss at boundaries |
| Separator | `##` (markdown headings) | Respect document structure — never split mid-section |
| Strategy | Hierarchical | Index both section headers (for retrieval) and section bodies (for grounding) |

**Example chunking:**

```
Chunk 1: "## R1 — Gross Merchandise Volume (GMV)\n|Attribute|Value|\n|Category|Revenue|..."
Chunk 2: "### R2 — Daily Revenue\n|Attribute|Value|\n|Category|Revenue|..."
```

Each KPI from `03-kpi-inventory.md` becomes its own chunk, keyed by its ID (`R1`, `R2`, `O1`, etc.).

---

## 4. Embedding Model

| Provider | Model | Dimensions | Use Case |
|----------|-------|------------|----------|
| OpenAI | `text-embedding-3-small` | 1536 | Default — best quality/cost ratio |
| Anthropic | (uses same OpenAI embeddings) | — | If OpenAI is the provider, reuse same |

**ASSUMPTION**: Embeddings are generated server-side during document indexing (CI/CD pipeline or build step).

---

## 5. Vector Store

### Option A: In-Memory (MVP)

```typescript
import { embedMany } from "ai"
import { MemoryVectorStore } from "ai/memory-store"

const store = new MemoryVectorStore(embeddings)
await store.upsert(chunks.map(c => ({
  id: c.id,
  embedding: await embed(c.text),
  metadata: { source: c.source, kpiId: c.kpiId }
})))
```

**Pros**: Zero infrastructure, deploy anywhere  
**Cons**: Lost on server restart, not shared across instances  
**Suitable for**: MVP / single-instance deployment

### Option B: Supabase pgvector (Production)

```sql
CREATE TABLE ai_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT,
  metadata JSONB,
  embedding VECTOR(1536)
);

CREATE INDEX ON ai_docs USING hnsw (embedding vector_cosine_ops);
```

**Pros**: Persistent, shared across instances, supports metadata filters  
**Cons**: Requires Supabase project  
**Suitable for**: V2+ production

### Option C: Vercel KV (Production)

```typescript
import { kv } from "@vercel/kv"
```

**Pros**: Managed, edge-ready  
**Cons**: Limited vector support compared to pgvector  
**Suitable for**: Edge-deployed AI

---

## 6. Retrieval Approach

```
User Query                         Retrieved Context
     │                                    ▲
     ▼                                    │
  ┌──────────┐                     ┌──────────────┐
  │ Embed     │────────────────────→│ Vector Search │
  │ Query     │    cosine sim > 0.8 │ (top-5 chunks)│
  └──────────┘                     └──────────────┘
     │                                    │
     ▼                                    ▼
  ┌──────────────────────────────────────────────────┐
  │         LLM Prompt Construction                    │
  │                                                    │
  │  System: "You are a marketplace AI assistant..."   │
  │  Context: [retrieved chunks about KPI definitions] │
  │  Question: "What was our GMV last week?"           │
  └──────────────────────────────────────────────────┘
```

### Query Rewriting

For better retrieval, the system rewrites user queries before embedding:

| User says | Rewritten for retrieval |
|-----------|------------------------|
| "How much did we make?" | "revenue gross merchandise volume GMV" |
| "Are sellers happy?" | "seller payout settlement velocity satisfaction" |
| "What's broken?" | "payment failure rate anomaly refund rate operational issues" |

---

## 7. Hybrid Search Strategy

Combine vector similarity with keyword matching for robustness:

```typescript
async function retrieve(query: string, topK = 5) {
  const vectorResults = await vectorStore.similaritySearch(query, topK)
  const keywordResults = await keywordSearch(query, topK)
  return mergeRerank(vectorResults, keywordResults)
}
```

Keyword search is especially important for KPI codes (`R1`, `O4`, `F2`) and exact metric names.

---

## 8. Re-ranking

Retrieved chunks are re-ranked by:

1. **Relevance score** (cosine similarity)
2. **Source priority** (KPI definitions > UI docs)
3. **Freshness** (more recent versions preferred)
4. **Deduplication** (remove chunks from the same source if they cover the same concept)

---

## 9. Context Assembly

The final context passed to the LLM is assembled as:

```
You have access to the following business context:

[KPI Definitions]
- R1 (GMV): SUM(payments.amount_cents) WHERE payments.status = approved
- R2 (Daily Revenue): SUM(amount_cents) WHERE status=approved AND DATE(created_at) = target_date
...

[Available Data Sources]
- GET /api/v1/payments — Returns: id, amount_cents, status, method, created_at, ...
- GET /api/v1/settlements — Returns: id, gross_amount_cents, fee_amount_cents, ...

[Dashboard Context]
- Active date range: Last 7 days (2026-06-04 to 2026-06-10)
- Active filters: None
```

---

## 10. Refresh Strategy

| Trigger | Action |
|---------|--------|
| New documentation added | Re-index in CI/CD pipeline after merge |
| KPI definitions changed | Re-index specific chunks for changed KPIs |
| API endpoints changed | Update system data map document, re-index |
| On deploy | Full re-index if in-memory; incremental if pgvector |

---

## 11. Evaluation

| Metric | Target | Method |
|--------|--------|--------|
| Retrieval precision | > 90% | Manual review of top-5 results for 50 test queries |
| Answer groundedness | 100% | Verify every claim in response traces back to retrieved chunk |
| Latency (retrieval) | < 200ms | p95 response time for vector search |
| Context relevance | > 85% | User satisfaction survey after AI interactions |
