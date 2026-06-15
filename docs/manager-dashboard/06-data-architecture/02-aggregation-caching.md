# 6.2 — Aggregation & Caching

> **Manager Dashboard — Data Architecture**
>
> Strategy for aggregating data across 4 apps and caching results for performance and reliability.

---

## 1. Why Aggregate?

| Problem | Solution |
|---------|----------|
| Data spread across 4 separate APIs | Central aggregation layer |
| Repeated queries for same metrics | Cached pre-computed values |
| Slow pagination over large datasets | Materialized aggregations |
| Source apps may be unavailable | Cache serves as fallback |
| Cross-reference metrics (e.g., revenue per product) | Joined in aggregation layer |

---

## 2. Aggregation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Manager Dashboard                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   Aggregation Layer                       │    │
│  │                                                            │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │    │
│  │  │ Metric        │  │ Cross-Ref    │  │ Time-Series     │   │    │
│  │  │ Aggregator    │  │ Engine       │  │ Builder         │   │    │
│  │  │               │  │              │  │                 │   │    │
│  │  │ • SUM, AVG,   │  │ • Payment +  │  │ • Hourly bins   │   │    │
│  │  │   COUNT, PCT  │  │   Settlement │  │ • Daily bins    │   │    │
│  │  │ • Group by    │  │ • Product +  │  │ • Weekly bins   │   │    │
│  │  │   date/seller │  │   Category   │  │ • Monthly bins   │   │    │
│  │  │ • Filtering   │  │ • Order +    │  │ • Rolling windows│   │    │
│  │  │               │  │   Shipment   │  │                 │   │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────────┘   │    │
│  │         │                  │                  │              │    │
│  │         └──────────────────┴──────────────────┘              │    │
│  │                            │                                  │    │
│  │                    ┌───────┴────────┐                        │    │
│  │                    │   Cache Layer   │                        │    │
│  │                    │  (In-memory +   │                        │    │
│  │                    │   Vercel KV)    │                        │    │
│  │                    └───────┬────────┘                        │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Metric Aggregator

The core aggregation function:

```typescript
interface AggregationInput {
  source: "payments" | "settlements" | "refunds" | "products" | "shipments"
  filters: Record<string, string>
  metrics: Array<{
    field: string
    operation: "sum" | "avg" | "count" | "min" | "max" | "pct"
    alias?: string
  }>
  groupBy?: string[]
}

interface AggregationResult {
  data: Record<string, number | string>[]
  total: number
  metadata: {
    source: string
    cached: boolean
    cachedAt: string | null
    latency: number
  }
}
```

**Common aggregations:**

```typescript
// R1 — GMV
aggregate({
  source: "payments",
  filters: { status: "approved", from, to },
  metrics: [{ field: "amount_cents", operation: "sum", alias: "gmv" }],
})

// O4 — Payment Success Rate
aggregate({
  source: "payments",
  filters: { from, to },
  metrics: [
    { field: "id", operation: "count", alias: "total" },
    { field: "id", operation: "count", alias: "successful" },
  ],
})

// R5 — Commission Revenue
aggregate({
  source: "settlements",
  filters: { status: "paid", from, to },
  metrics: [{ field: "fee_amount_cents", operation: "sum", alias: "commission" }],
})
```

---

## 4. Cross-Reference Engine

Metrics that require joining data from multiple apps are computed here:

### 4.1 Revenue by Product (P4)

```
Input:
  Payments.items_summary[].items[] → { product_id, unit_price_cents, quantity }
  Seller /api/v1/products          → { id, title, category }

Process:
  1. Fetch payments with items_summary for date range
  2. Extract unique product_ids from items_summary (JSON array of seller groups)
  3. Fetch products for those IDs
  4. Join: product revenue = SUM(unit_price_cents * quantity)
  5. Group by product title and category

Output:
  [{ product_id, product_name, category, revenue_cents, units_sold }]
```

### 4.2 Revenue by Category (P6)

```
Same as above, but group by category instead of product.

Output:
  [{ category, revenue_cents, percentage_of_total }]
```

### 4.3 Seller Performance (S2)

```
Input:
  Payments /api/v1/settlements  → { seller_profile_id, gross_amount_cents, ... }

Process:
  1. Fetch all settlements for date range
  2. Group by seller_profile_id
  3. Sum gross_amount_cents, fee_amount_cents, net_amount_cents
  4. Fetch seller names (requires seller profile endpoint)

Output:
  [{ seller_id, seller_name, gross_revenue, commission, net_revenue, order_count }]
```

### 4.4 Order Fulfillment Funnel (OP1)

```
Input:
  Payments /api/v1/payments     → { order_id, status }
  Seller /api/v1/sales-orders   → { order_id, fulfillment_status }
  Shipping /api/v1/shipments    → { order_id, status }

Process:
  1. Join payments → sales_orders → shipments via order_id
  2. Trace each order through funnel states

Funnel stages:
  Paid → Seller Accepted → Shipped → Delivered

Output:
  [{ stage, count, percentage_drop_from_previous }]
```

---

## 5. Cache Layer

### 5.1 Cache Tiers

| Tier | Storage | Speed | Persistence | Use Case |
|------|---------|-------|-------------|----------|
| L1 | In-memory (Map) | < 1ms | Lost on restart | Current session, hot metrics |
| L2 | Vercel KV (Redis) | < 5ms | Persistent | Shared across instances |
| L3 | Database (Postgres) | < 20ms | Persistent | Historical aggregations |

### 5.2 Cache Keys

```typescript
// Pattern: {entity}:{aggregation}:{filters-hash}
cacheKey("payments:sum:amount_cents", { from: "2026-06-01", to: "2026-06-11" })
// → "payments:sum:amount_cents:from=2026-06-01_to=2026-06-11"

cacheKey("settlements:group:seller_profile_id", { from: "2026-05-01", to: "2026-06-01" })
// → "settlements:group:seller_profile_id:from=2026-05-01_to=2026-06-01"
```

### 5.3 TTL Strategy

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Today's payment metrics | 60s | Near real-time needed |
| Historical payment metrics | 5 min | Rarely changes |
| Settlement/payout data | 5 min | Changes on manual admin action |
| Product catalog | 5 min | Changes on seller update |
| Seller profiles | 1 hour | Rarely changes |
| Cross-reference joins | 5 min | Depends on source data freshness |
| Time-series (hourly/daily) | 1 hour | Pre-computed, stable |

### 5.4 Cache-Aside Pattern

```typescript
async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<{ data: T; cached: boolean; cachedAt: string | null }> {
  // 1. Try L1 (in-memory)
  const l1 = l1Cache.get(key)
  if (l1 && !isExpired(l1, ttl)) return { data: l1.value, cached: true, cachedAt: l1.cachedAt }

  // 2. Try L2 (Vercel KV)
  const l2 = await kv.get(key)
  if (l2) {
    l1Cache.set(key, l2)
    return { data: l2.value, cached: true, cachedAt: l2.cachedAt }
  }

  // 3. Fetch fresh
  const data = await fetchFn()

  // 4. Store in L1 + L2
  const entry = { value: data, cachedAt: new Date().toISOString() }
  l1Cache.set(key, entry)
  await kv.set(key, entry, { ex: ttl })

  return { data, cached: false, cachedAt: null }
}
```

---

## 6. In-Memory Store (L1)

For MVP, a lightweight in-memory store is sufficient:

```typescript
class MemoryCache {
  private store = new Map<string, { value: unknown; cachedAt: string }>()

  get(key: string): { value: unknown; cachedAt: string } | null {
    return this.store.get(key) ?? null
  }

  set(key: string, value: unknown): void {
    this.store.set(key, { value, cachedAt: new Date().toISOString() })
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now - new Date(entry.cachedAt).getTime() > MAX_TTL_MS) {
        this.store.delete(key)
      }
    }
  }
}
```

For production (multi-instance), replace with Vercel KV or Redis.

---

## 7. Time-Series Builder

Pre-computes time-bucketed aggregations for chart rendering:

```typescript
interface TimeSeriesConfig {
  source: "payments" | "settlements" | "refunds"
  metric: "amount_cents" | "fee_amount_cents" | "count"
  operation: "sum" | "avg" | "count"
  granularity: "hour" | "day" | "week" | "month"
  range: { from: string; to: string }
}

// Example: daily revenue for last 30 days
const dailyRevenue = buildTimeSeries({
  source: "payments",
  metric: "amount_cents",
  operation: "sum",
  granularity: "day",
  range: { from: "-30 days", to: "today" },
})
// Output: [{ date: "2026-05-12", value: 1250000 }, ...]
```

For MVP, time-series can be computed client-side from the raw payment data. For V2+, pre-compute in a background job for faster loads.

---

## 8. Data Refresh Orchestration

```typescript
class RefreshOrchestrator {
  private jobs: Map<string, RefreshJob> = new Map()

  register(job: RefreshJob): void {
    this.jobs.set(job.name, job)
  }

  start(): void {
    for (const job of this.jobs.values()) {
      this.runJob(job)
      setInterval(() => this.runJob(job), job.interval)
    }
  }

  private async runJob(job: RefreshJob): Promise<void> {
    const start = performance.now()
    try {
      const data = await job.fetch()
      await job.cache(data)
      logger.info(`Job ${job.name} completed in ${performance.now() - start}ms`)
    } catch (err) {
      logger.error(`Job ${job.name} failed`, err)
    }
  }
}

// Registered jobs:
const orchestrator = new RefreshOrchestrator()

orchestrator.register({
  name: "payments-today",
  interval: 60_000,
  fetch: () => paymentsClient.getPayments({ from: "today", to: "today" }),
  cache: (data) => cache.set("payments:today", data),
})

orchestrator.register({
  name: "pending-settlements",
  interval: 300_000,
  fetch: () => paymentsClient.getSettlements({ status: "pending" }),
  cache: (data) => cache.set("settlements:pending", data),
})

orchestrator.register({
  name: "product-catalog",
  interval: 300_000,
  fetch: () => sellerClient.getProducts({ limit: "1000" }),
  cache: (data) => cache.set("products:catalog", data),
})
```

---

## 9. Cache Invalidation

| Event | Invalidation Action |
|-------|-------------------|
| Time-based TTL expires | Next fetch replaces stale data |
| Manual refresh (user clicks refresh) | Bypass cache, fetch fresh, update cache |
| Source API returns 404 for cached resource | Remove from cache |
| Deployment/restart | L1 cleared, L2/L3 remain (persistent) |

---

## 10. Performance Targets

| Metric | Target |
|--------|--------|
| p50 dashboard load time | < 500ms |
| p95 dashboard load time | < 2s |
| Cache hit ratio (L1) | > 80% for repeated queries within session |
| Cache hit ratio (L2) | > 60% for shared metrics across sessions |
| Background job failure rate | < 1% |
| Stale data threshold | Never show data older than 2x refresh interval |
