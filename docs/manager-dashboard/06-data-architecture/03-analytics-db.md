# 6.3 — Analytics Database

> **Manager Dashboard — Data Architecture**
>
> Schema and strategy for the optional analytics database that stores pre-computed metrics and enables historical analysis.

---

## 1. When an Analytics DB Is Needed

The dashboard can operate without a dedicated database for MVP by querying source APIs on-demand and caching results in memory. A database becomes necessary when:

| Requirement | Without DB | With DB |
|-------------|-----------|---------|
| Historical trend analysis (6+ months) | Slow — must paginate through all historical data | Instant — pre-aggregated by day/week/month |
| Cross-app joins (product + payment) | Repeated API calls per query | Materialized join table |
| Dashboard load speed | Depends on source API latency | < 50ms for pre-computed metrics |
| Data when sources are down | Stale cache only | Historical data always available |
| Complex queries (customer segments, cohorts) | Not feasible | SQL aggregate queries |

**Recommendation**: Start without a DB for MVP (rely on caching + on-demand API calls). Add a lightweight analytics DB for V2.

---

## 2. Analytics DB Schema

### 2.1 Design Principles

- **Star schema**: Fact tables for metrics, dimension tables for entities
- **Append-only**: New rows inserted daily; no updates to historical data
- **Idempotent**: Re-running today's ingestion produces same result (UPSERT)
- **Minimal**: Only pre-computed aggregations, not raw data

### 2.2 Fact Tables

#### `fact_daily_payments`

```sql
CREATE TABLE fact_daily_payments (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_payments INT NOT NULL,
  successful_payments INT NOT NULL,
  failed_payments INT NOT NULL,
  total_amount_cents BIGINT NOT NULL,
  successful_amount_cents BIGINT NOT NULL,
  avg_order_value_cents INT NOT NULL,
  payment_method_breakdown JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date)
);
```

**Population query** (runs daily at 00:15):

```sql
INSERT INTO fact_daily_payments (date, total_payments, successful_payments, failed_payments, total_amount_cents, successful_amount_cents, avg_order_value_cents, payment_method_breakdown)
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'approved') as successful_payments,
  COUNT(*) FILTER (WHERE status IN ('rejected', 'cancelled')) as failed_payments,
  SUM(amount_cents) as total_amount_cents,
  SUM(amount_cents) FILTER (WHERE status = 'approved') as successful_amount_cents,
  AVG(amount_cents) FILTER (WHERE status = 'approved')::INT as avg_order_value_cents,
  jsonb_object_agg(method, cnt) as payment_method_breakdown
FROM (
  SELECT method, COUNT(*) as cnt
  FROM payments
  WHERE DATE(created_at) = CURRENT_DATE - 1
  GROUP BY method
) methods
JOIN payments p ON DATE(p.created_at) = CURRENT_DATE - 1
GROUP BY DATE(created_at)
ON CONFLICT (date) DO UPDATE SET
  total_payments = EXCLUDED.total_payments,
  successful_payments = EXCLUDED.successful_payments,
  failed_payments = EXCLUDED.failed_payments,
  total_amount_cents = EXCLUDED.total_amount_cents,
  successful_amount_cents = EXCLUDED.successful_amount_cents,
  avg_order_value_cents = EXCLUDED.avg_order_value_cents,
  payment_method_breakdown = EXCLUDED.payment_method_breakdown;
```

#### `fact_daily_settlements`

```sql
CREATE TABLE fact_daily_settlements (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_settlements INT NOT NULL,
  pending_settlements INT NOT NULL,
  paid_settlements INT NOT NULL,
  gross_amount_cents BIGINT NOT NULL,
  fee_amount_cents BIGINT NOT NULL,
  net_amount_cents BIGINT NOT NULL,
  seller_count INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date)
);
```

#### `fact_daily_refunds`

```sql
CREATE TABLE fact_daily_refunds (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_refunds INT NOT NULL,
  approved_refunds INT NOT NULL,
  total_refund_amount_cents BIGINT NOT NULL,
  reason_breakdown JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date)
);
```

#### `fact_daily_shipments`

```sql
CREATE TABLE fact_daily_shipments (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_shipments INT NOT NULL,
  delivered_shipments INT NOT NULL,
  in_transit_shipments INT NOT NULL,
  pending_shipments INT NOT NULL,
  avg_delivery_time_hours DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date)
);
```

### 2.3 Dimension Tables

#### `dim_sellers`

```sql
CREATE TABLE dim_sellers (
  id BIGSERIAL PRIMARY KEY,
  seller_profile_id UUID NOT NULL UNIQUE,
  display_name VARCHAR(255),
  verification_status VARCHAR(50),
  first_activity_date DATE,
  last_activity_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Populated from Seller App profiles; updated daily.

#### `dim_products`

```sql
CREATE TABLE dim_products (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE,
  title VARCHAR(255),
  category VARCHAR(100),
  condition VARCHAR(50),
  seller_profile_id UUID,
  price_cents INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Updated from product catalog polling.

---

## 3. Materialized Views

For complex cross-reference queries, materialized views are refreshed daily:

### `mv_seller_daily_revenue`

```sql
CREATE MATERIALIZED VIEW mv_seller_daily_revenue AS
SELECT
  DATE(s.created_at) as date,
  s.seller_profile_id,
  sd.display_name as seller_name,
  COUNT(DISTINCT s.id) as settlement_count,
  SUM(s.gross_amount_cents) as gross_revenue_cents,
  SUM(s.fee_amount_cents) as commission_cents,
  SUM(s.net_amount_cents) as net_revenue_cents
FROM settlements s
LEFT JOIN dim_sellers sd ON s.seller_profile_id = sd.seller_profile_id
WHERE s.status = 'paid'
GROUP BY DATE(s.created_at), s.seller_profile_id, sd.display_name
ORDER BY date DESC;

CREATE UNIQUE INDEX ON mv_seller_daily_revenue (date, seller_profile_id);
```

### `mv_category_daily_revenue`

```sql
CREATE MATERIALIZED VIEW mv_category_daily_revenue AS
SELECT
  DATE(p.created_at) as date,
  dp.category,
  COUNT(DISTINCT p.id) as payment_count,
  SUM(p.amount_cents) as revenue_cents
FROM payments p
CROSS JOIN LATERAL jsonb_array_elements(p.items_summary::jsonb) AS sg
CROSS JOIN LATERAL jsonb_array_elements(sg->'items') AS item
JOIN dim_products dp ON dp.product_id = (item->>'product_id')::UUID
WHERE p.status = 'approved'
GROUP BY DATE(p.created_at), dp.category
ORDER BY date DESC;

CREATE UNIQUE INDEX ON mv_category_daily_revenue (date, category);
```

> **Note**: `items_summary` is a JSON array of seller groups. Each seller group has an `items` array containing individual products with `product_id`, `unit_price_cents`, `quantity`, and `product_name_snapshot`.

---

## 4. Historical Snapshot Strategy

| Granularity | Retention | Purpose |
|-------------|-----------|---------|
| Daily | Forever | Long-term trend analysis |
| Hourly | 90 days | Short-term operational analysis |
| Real-time (cache) | TTL-based | Current dashboard views |

---

## 5. Database Choice

| Option | Pros | Cons | Recommendation |
|--------|------|------|---------------|
| **Supabase Postgres** | Shared with existing apps? Managed, easy setup | Potential cost at scale | **Recommended** |
| PlanetScale | MySQL-compatible, branching | No foreign keys | Alternative |
| SQLite (Turso) | Edge-ready, zero-ops | Limited concurrency | Not recommended for analytics |
| ClickHouse | Columnar, fast aggregations | Operational overhead | Overkill for MVP |

---

## 6. Ingestion Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Source APIs   │───→│ ETL Job       │───→│ Analytics DB  │
│ (4 apps)      │    │ (daily cron)  │    │ (Postgres)    │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Fact tables   │
                    │ populated     │
                    │ at 00:15 daily│
                    └──────────────┘
```

**ETL Job** (Vercel Cron or similar):

```typescript
export async function runDailyETL() {
  const yesterday = getYesterday()

  const [payments, settlements, refunds, shipments] = await Promise.all([
    paymentsClient.getPayments({ from: yesterday, to: yesterday }),
    paymentsClient.getSettlements({ from: yesterday, to: yesterday }),
    paymentsClient.getRefunds({ from: yesterday, to: yesterday }),
    shippingClient.getShipments({ from: yesterday, to: yesterday }),
  ])

  const dailyPayments = aggregatePayments(payments.data)
  const dailySettlements = aggregateSettlements(settlements.data)
  const dailyRefunds = aggregateRefunds(refunds.data)
  const dailyShipments = aggregateShipments(shipments.data)

  await db.insert(factDailyPayments).values(dailyPayments).onConflictDoUpdate()
  await db.insert(factDailySettlements).values(dailySettlements).onConflictDoUpdate()
  await db.insert(factDailyRefunds).values(dailyRefunds).onConflictDoUpdate()
  await db.insert(factDailyShipments).values(dailyShipments).onConflictDoUpdate()

  await db.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_seller_daily_revenue")
  await db.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_daily_revenue")
}
```

---

## 7. Query Patterns

### Dashboard: Executive Overview (last 30 days)

```sql
SELECT
  SUM(successful_amount_cents) as gmv,
  SUM(total_payments) as order_count,
  AVG(avg_order_value_cents) as aov,
  SUM(successful_payments)::FLOAT / NULLIF(SUM(total_payments), 0) * 100 as success_rate
FROM fact_daily_payments
WHERE date >= CURRENT_DATE - 30
```

### Dashboard: Revenue by Seller (last 7 days)

```sql
SELECT
  seller_name,
  SUM(gross_revenue_cents) as revenue,
  SUM(commission_cents) as commission,
  SUM(net_revenue_cents) as net
FROM mv_seller_daily_revenue
WHERE date >= CURRENT_DATE - 7
GROUP BY seller_profile_id, seller_name
ORDER BY revenue DESC
```

### Dashboard: Monthly Trend (last 12 months)

```sql
SELECT
  DATE_TRUNC('month', date) as month,
  SUM(successful_amount_cents) as revenue
FROM fact_daily_payments
WHERE date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month
```

---

## 8. Scaling Considerations

| Scale | Data Volume | Strategy |
|-------|-------------|----------|
| MVP (< 1K orders/day) | < 365K rows/year in fact tables | No DB needed; cache + on-demand |
| Growth (< 10K orders/day) | < 3.6M rows/year | Single Postgres instance, daily fact tables |
| Scale (> 10K orders/day) | > 3.6M rows/year | Add hourly fact tables, partitioning by month |
