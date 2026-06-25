# 6.1 — Data Ingestion

> **Manager Dashboard — Data Architecture**
>
> Strategy for fetching data from the 4 BiciMarket apps, handling authentication, pagination, errors, and rate limits.

---

## 1. Design Principles

| Principle | Rationale |
|-----------|-----------|
| **Read-only** | Dashboard never writes to source apps — only GET requests |
| **Polling-based** | No event bus available; periodic polling is the MVP approach |
| **Graceful degradation** | If one app is down, the dashboard still works with partial data |
| **Idempotent** | Repeated fetches produce the same result; no side effects |
| **Observable** | Every fetch is logged with duration, status, and bytes |

---

## 2. Service Integration Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                   Manager Dashboard                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                 Service Integration Layer                  │    │
│  │                                                            │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────┐ │    │
│  │  │ Payments     │ │ Buyer        │ │ Seller       │ │Shipping│ │    │
│  │  │ Client       │ │ Client       │ │ Client       │ │Client │ │    │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──┬───┘ │    │
│  │         │               │               │           │       │    │
│  │         └───────────────┴───────────────┴───────────┘       │    │
│  │                      │                                       │    │
│  │              ┌───────┴────────┐                              │    │
│  │              │  HTTP Client   │  (fetch with retry + auth)    │    │
│  │              └────────────────┘                              │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
   payments.bicimarket  buyer.bicimarket    seller.bicimarket
         ▲                    ▲                    ▲
         │                    │                    │
   X-Service-Token      X-Service-Token      X-Service-Token
```

---

## 3. Service Client Template

Each app gets its own client class sharing a common interface:

```typescript
interface ServiceClient {
  baseUrl: string
  serviceToken: string
  fetch<T>(path: string, params?: Record<string, string>): Promise<PaginatedResponse<T>>
}

class BaseServiceClient implements ServiceClient {
  constructor(
    public baseUrl: string,
    public serviceToken: string,
    private options: { timeout: number; retries: number } = { timeout: 10000, retries: 3 }
  ) {}

  async fetch<T>(path: string, params?: Record<string, string>): Promise<PaginatedResponse<T>> {
    const url = new URL(path, this.baseUrl)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

    let lastError: Error | null = null
    for (let attempt = 1; attempt <= this.options.retries; attempt++) {
      try {
        const res = await fetch(url.toString(), {
          headers: {
            "X-Service-Token": this.serviceToken,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(this.options.timeout * attempt),
        })

        if (!res.ok) throw new ApiError(res.status, await res.text())
        return res.json()
      } catch (err) {
        lastError = err as Error
        if (attempt < this.options.retries) await sleep(1000 * attempt)
      }
    }
    throw lastError
  }
}
```

---

## 4. Service-Specific Clients

### 4.1 Payments Client

```typescript
class PaymentsClient extends BaseServiceClient {
  constructor(token: string) {
    super("https://payments.bicimarket.com", token)
  }

  getPayments(filters?: PaymentFilters) {
    return this.fetch("/api/v1/payments", filters as Record<string, string>)
  }

  getSettlements(filters?: SettlementFilters) {
    return this.fetch("/api/v1/settlements", filters as Record<string, string>)
  }

  getRefunds(filters?: RefundFilters) {
    return this.fetch("/api/v1/refunds", filters as Record<string, string>)
  }

  getPayouts(filters?: PayoutFilters) {
    return this.fetch("/api/v1/payouts", filters as Record<string, string>)
  }

  getReceipts(filters?: ReceiptFilters) {
    return this.fetch("/api/v1/receipts", filters as Record<string, string>)
  }
}
```

**Known filters** (from `GET /api/v1/payments` documentation):
- `page`, `limit` — pagination (default limit=20)
- `from`, `to` — date range (ISO 8601)
- `status` — `pending`, `approved`, `rejected`, `cancelled`, `refunded`
- `method` — `credit_card`, `debit_card`, `cash`, `transfer`, `mercadopago`, `wallet`

### 4.2 Buyer Client

```typescript
class BuyerClient extends BaseServiceClient {
  constructor(token: string) {
    super("https://buyer.bicimarket.com", token)
  }

  getOrders(filters?: OrderFilters) {
    return this.fetch("/api/v1/buyer/orders", filters as Record<string, string>)
  }

  getOrder(id: string) {
    return this.fetch(`/api/v1/buyer/orders/${id}`)
  }

  getBuyerProfile(id: string) {
    return this.fetch(`/api/v1/buyer/profile`, { id })
  }
}
```

> **ASSUMPTION**: `GET /api/v1/buyer/orders` returns orders for the authenticated user only (buyer-scoped). An admin endpoint `GET /api/v1/admin/orders` would be needed to list all orders across buyers for the dashboard. If not available, revenue/order data must be derived from Payments App payments instead.

### 4.3 Seller Client

```typescript
class SellerClient extends BaseServiceClient {
  constructor(token: string) {
    super("https://seller.bicimarket.com", token)
  }

  getProducts(filters?: ProductFilters) {
    return this.fetch("/api/v1/products", filters as Record<string, string>)
  }

  getSalesOrders(filters?: SalesOrderFilters) {
    return this.fetch("/api/v1/sales-orders", filters as Record<string, string>)
  }
}
```

> **ASSUMPTION**: `GET /api/v1/products` and `GET /api/v1/sales-orders` return data scoped to the authenticated seller. An admin-level endpoint is not documented for cross-seller queries. If unavailable, the dashboard may need to iterate seller profiles (requires a `GET /api/v1/seller-profiles` endpoint).

### 4.4 Shipping Client

```typescript
class ShippingClient extends BaseServiceClient {
  constructor(token: string) {
    super("https://shipping.bicimarket.com", token)
  }

  getShipments(filters?: ShipmentFilters) {
    return this.fetch("/api/v1/shipments", filters as Record<string, string>)
  }

  getShipmentGroups(filters?: GroupFilters) {
    return this.fetch("/api/v1/shipment-groups", filters as Record<string, string>)
  }

  getLogisticsOperators() {
    return this.fetch("/api/v1/logistics-operators")
  }
}
```

> **ASSUMPTION**: `GET /api/v1/shipments` without an `orderId` filter is not documented. An unfiltered admin endpoint may not exist.

---

## 5. Pagination Handling

All documented APIs use cursor/offset pagination with `page` and `limit` parameters.

```typescript
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

async function fetchAll<T>(
  client: ServiceClient,
  path: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const results: T[] = []
  let page = 1

  while (true) {
    const res = await client.fetch<T>(path, { ...params, page: String(page), limit: "100" })
    results.push(...res.data)
    if (!res.pagination.hasMore) break
    page++
  }

  return results
}
```

**Rate limiting considerations**:
- Default page limit is 20 (global) or 50 (Seller App)
- Use `limit=100` for dashboard ingestion to minimize round trips
- Respect `Retry-After` header if 429 received
- Cache large responses (product catalog, historical payments)

---

## 6. Ingestion Patterns

### 6.1 On-Demand (User Request)

When a user views a page or asks a question, data is fetched live.

**Pros**: Always fresh, no stale data  
**Cons**: Slower load time, repeated fetches

### 6.2 Pre-Fetch (Background Polling)

A background job periodically fetches and caches data.

**Pros**: Fast page loads, consistent data  
**Cons**: Slightly stale data (up to 5 min), infrastructure for background jobs

### 6.3 Hybrid (Recommended)

| Data Type | Strategy | Refresh Interval | Rationale |
|-----------|----------|-----------------|-----------|
| Payment metrics (today) | Pre-fetch | 60s | Near real-time, high interest |
| Historical payments (> 1 day) | Cache-on-read | 5 min | Infrequently changed |
| Settlements/payouts | Pre-fetch | 5 min | Slower-changing data |
| Product catalog | Cache-on-read | 5 min | Changes when sellers update |
| Seller profiles | Cache-on-read | 1 hour | Rarely changes |
| Shipments in transit | Pre-fetch | 2 min | Operational importance |
| Delivered/completed shipments | Cache-on-read | 30 min | Historical, no longer changes |

---

## 7. Error Handling Matrix

| Scenario | Behavior | User Impact |
|----------|----------|-------------|
| Single API timeout (30s) | Retry 2x, then skip data source | Partial data with warning banner |
| All APIs timeout | Show cached data with "Last updated: X min ago" | Stale data, not blank screen |
| 401/403 (auth error) | Log alert, show error card | "Authentication error — contact admin" |
| 429 (rate limited) | Backoff and retry, cache current data | Slight delay, no error shown |
| 5xx (server error) | Retry 2x, then skip | Partial data |
| Invalid JSON response | Log and skip source | Partial data |
| Network error (DNS/connectivity) | Retry 2x, then show degraded state | "App X unreachable" banner |

---

## 8. Authentication

```typescript
// Environment variables
X_SERVICE_TOKEN_PAYMENTS=...
X_SERVICE_TOKEN_BUYER=...
X_SERVICE_TOKEN_SELLER=...
X_SERVICE_TOKEN_SHIPPING=...
```

Each app uses a different `X-Service-Token` for server-to-server communication. The dashboard must have its own service token for each app, configured by the admin.

**ASSUMPTION**: The 4 apps allow service-to-service tokens for the Manager Dashboard. If not, a new token must be provisioned per app with admin-level access.

---

## 9. Data Freshness Dashboard

A system health component shows the data freshness status for each source:

```
┌──────────────────────────────────────┐
│  Data Source Status                  │
│                                      │
│  ✅ Payments    Last sync: 30s ago   │
│  ✅ Buyer       Last sync: 2m ago    │
│  ⚠️ Seller       Last sync: 5m ago   │
│  ✅ Shipping    Last sync: 1m ago    │
│  ❌ Products    Connection error     │
└──────────────────────────────────────┘
```
