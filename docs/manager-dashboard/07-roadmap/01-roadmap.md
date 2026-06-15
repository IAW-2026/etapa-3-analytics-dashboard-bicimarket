# 7 — Roadmap

> **Manager Dashboard — Product Roadmap**
>
> Phased delivery plan from MVP through V4, mapping features, screens, KPI support, and architectural investments to each phase.

---

## 1. Delivery Philosophy

| Principle | Rationale |
|-----------|-----------|
| **Working dashboard in 6 weeks** | MVP must deliver value fast to validate the investment |
| **Read-only MVP** | No mutations = lower risk, faster delivery |
| **P0 KPIs first** | Revenue, orders, success rate — the essentials |
| **Data source gaps deferred** | If an API doesn't exist, MVP works around it (ASSUMPTION) |
| **AI comes after data** | Copilot requires reliable data foundation (V2) |

---

## 2. Phase Overview

```
Phase         Timeline     Focus                         Key Deliverables
───────────────────────────────────────────────────────────────────────────
MVP (V1)      Weeks 1-6    Core KPIs + Executive View    Payments data, 8 screens, admin auth
V2            Weeks 7-14   AI Copilot + Operations       Chat, anomaly detection, forecasting
V3            Weeks 15-22  Finance + Advanced Analytics   What-if, reports, root cause analysis
V4            Weeks 23-30  Customer Intelligence + Scale  Segmentation, meeting mode, performance
```

---

## 3. MVP (V1) — Weeks 1-6

### Goal
Deliver a working executive dashboard focused on revenue, orders, and financial KPIs using only documented Payments App endpoints (the most complete API).

### Why Payments-first
- Payments App has the most complete GET endpoints with filters
- Payments App already has an admin dashboard (can be extended)
- Revenue data is the highest-priority KPI for executives

### Screens Delivered

| Screen | Priority | Data Source | Est. Effort |
|--------|----------|-------------|-------------|
| 4.1 Executive Overview | P0 | Payments | 1 week |
| 4.2 Sales Analytics | P0 | Payments | 1 week |
| 4.4 Finance Dashboard | P0 | Payments | 1 week |
| 4.3 Operations Dashboard | P1 | Payments + Shipping (limited) | 1.5 weeks |
| 4.6 Product Analytics (basic) | P1 | Payments (items_summary) | 1 week |
| 4.7 Seller Analytics (basic) | P1 | Payments (settlements) | 1 week |

### Screens Deferred to V2

| Screen | Reason |
|--------|--------|
| 4.5 Customer Analytics | Requires Buyer App admin endpoint (not documented) |
| 4.8 AI Copilot Interface | Depends on data foundation |

### KPIs Supported

| KPI | Data Source |
|-----|-------------|
| R1 — GMV | `GET /api/v1/payments` |
| R2 — Daily Revenue | `GET /api/v1/payments` (date filter) |
| R4 — Average Order Value | `GET /api/v1/payments` |
| R5 — Commission Revenue | `GET /api/v1/settlements` |
| R7 — Revenue Growth Rate | `GET /api/v1/payments` (period compare) |
| O1 — Total Orders | `GET /api/v1/payments` |
| O4 — Payment Success Rate | `GET /api/v1/payments` |
| O6 — Refund Rate | `GET /api/v1/refunds` + `GET /api/v1/payments` |
| F1 — Pending Settlements | `GET /api/v1/settlements` (status=pending) |
| F5 — Total Marketplace Revenue | `GET /api/v1/settlements` (status=paid) |
| P1 — Active Products | `GET /api/v1/products` (if admin endpoint exists) |

### Architecture Deliverables

| Component | Approach |
|-----------|----------|
| Authentication | Clerk middleware, `publicMetadata.admin = true` check |
| Service clients | Payments Client only (other apps on-demand) |
| Caching | In-memory Map (L1 only) |
| Aggregation | Client-side from raw API responses |
| State management | React context or Zustand for dashboard filters |
| UI framework | shadcn + Recharts (as designed in Phase 4) |

### Data Source Gaps (MVP)

| Gap | Impact | Mitigation |
|-----|--------|------------|
| No batch Buyer App endpoint | Customer metrics unavailable | Defer to V2 |
| No batch Seller App admin endpoint | Seller listing unavailable | Derive seller data from payments.settlements |
| No batch Shipping App endpoint | Limited shipment metrics | Defer to V2 |
| Cross-reference metrics | Not available | Payments-only KPIs for MVP |

### MVP Success Criteria

- [ ] Dashboard loads in < 2s (p95)
- [ ] 8 core P0 KPIs displayed accurately
- [ ] Date range filtering works (7d, 30d, 90d, custom)
- [ ] At least 4 screens fully functional
- [ ] Revenue data matches Payments App admin panel
- [ ] Admin users can access dashboard with existing Clerk setup

---

## 4. V2 — Weeks 7-14

### Goal
Add AI Copilot, operations monitoring, and anomaly detection. Fill MVP data gaps by provisioning admin endpoints in other apps.

### Prerequisites
- [ ] Admin batch endpoints added to Buyer, Seller, and Shipping apps (or ASSUMPTION accepted)
- [ ] Analytics DB provisioned (optional — can use caching only)
- [ ] LLM API keys configured and budget approved

### New Screens

| Screen | Priority | Notes |
|--------|----------|-------|
| 4.8 AI Copilot Interface | P1 | Chat-based query + insights |
| 4.5 Customer Analytics | P1 | Requires Buyer App admin endpoint |
| 4.6 Product Analytics (full) | P1 | Adds cross-reference revenue by product |
| 4.7 Seller Analytics (full) | P1 | Adds seller ranking and trends |

### AI Features Delivered

| Feature | Est. Effort | Dependencies |
|---------|-------------|--------------|
| F1 — Natural Language Query | 2 weeks | Tool registry, LLM provider |
| F2 — Chart Explanation | 0.5 weeks | None (client-side data) |
| F3 — Proactive Anomaly Detection | 2 weeks | Background polling, historical data |
| F4 — Revenue Forecasting | 1.5 weeks | Historical data (> 3 months) |
| F5 — Weekly Briefing | 1 week | All core endpoints |

### Architecture Deliverables

| Component | Upgrade from MVP |
|-----------|-----------------|
| Service clients | All 4 app clients implemented |
| Caching | L2 (Vercel KV / Redis) added |
| Analytics DB | Optional — can use Supabase or in-memory |
| AI infra | Vercel AI SDK integration, tool registry |
| Background jobs | Vercel Cron for polling + anomaly detection |

### New KPIs Supported

| KPI | Data Source |
|-----|-------------|
| R3 — Revenue by Seller | Settlements grouped by seller |
| R6 — Effective Take Rate | Settlement fee/gross ratio |
| O5 — Payment Failure by Reason | Payment attempts |
| O7 — Refund by Reason | Refund reason field |
| OP1 — Fulfillment Rate | Shipments (requires Shipping endpoint) |
| OP2 — Average Delivery Time | Shipments |
| OP4 — Seller Acceptance Rate | Sales orders |
| OP5 — Pending Shipments | Shipments |
| F2 — Settlement Velocity | Settlement + payout timestamps |
| F3 — Payout Volume | Payouts |
| F4 — Failed Settlement Rate | Settlements |

### V2 Success Criteria

- [ ] AI Copilot answers 10+ common business questions correctly
- [ ] Chart explanation works on all visualizations
- [ ] Anomaly detection flags metric deviations with < 5% false positive rate
- [ ] Revenue forecast available and within ±20% accuracy
- [ ] Weekly briefing generates in < 10 seconds
- [ ] Data sources include all 4 apps
- [ ] Admin batch endpoints provisioned in Buyer, Seller, and Shipping apps
- [ ] Cache hit ratio > 60% for shared metrics

---

## 5. V3 — Weeks 15-22

### Goal
Advanced analytics, what-if modeling, scheduled reports, and automated root cause analysis.

### Prerequisites
- [ ] Minimum 6 months of historical data accumulated
- [ ] Analytics DB operational with daily fact tables
- [ ] PDF generation library integrated

### New Features

| Feature | Est. Effort | Dependencies |
|---------|-------------|--------------|
| F6 — What-If Analysis | 1 week | Settlement data |
| F7 — Scheduled Report Generation | 2 weeks | PDF lib, email service |
| F8 — Root Cause Analysis | 2.5 weeks | Historical data, anomaly detection |

### Screen Enhancements

| Screen | Enhancement |
|--------|-------------|
| 4.4 Finance Dashboard | Add what-if simulator panel for commission modeling |
| 4.2 Sales Analytics | Add root cause analysis button ("Why did sales drop?") |
| All screens | Export to PDF button on every chart |

### Architecture Deliverables

| Component | Upgrade |
|-----------|---------|
| PDF generation | `@react-pdf/renderer` or Puppeteer |
| Email integration | Resend / SendGrid for scheduled reports |
| Analytics DB | Materialized views, hourly fact tables |
| What-if engine | Server-side simulation functions |

### New KPIs Supported

| KPI | Note |
|-----|------|
| All P1 KPIs from KPI Inventory | By V3, all P1 KPIs should be available |
| Seller Revenue Ranking | Enhanced seller analytics |
| Category Growth Rate | Time-series category comparison |

### V3 Success Criteria

- [ ] What-if analysis answers "what if we change commission to X%" in < 3 seconds
- [ ] Scheduled reports generate and deliver on time (weekly + monthly)
- [ ] Root cause analysis correctly identifies metric drop causes in > 70% of test cases
- [ ] All P1 KPIs displayed across all screens
- [ ] PDF export works on all screens with charts

---

## 6. V4 — Weeks 23-30

### Goal
Customer intelligence, meeting mode, performance optimization, and platform maturity.

### Prerequisites
- [ ] Customer segmentation data pipeline operational
- [ ] Buyer App exposes per-buyer order history endpoint
- [ ] Performance monitoring dashboards in place

### New Features

| Feature | Est. Effort | Dependencies |
|---------|-------------|--------------|
| F9 — Customer Segmentation | 2.5 weeks | Buyer per-buyer endpoint |
| F10 — Meeting Mode | 2 weeks | All prior features |

### Screen Enhancements

| Screen | Enhancement |
|--------|-------------|
| 4.5 Customer Analytics | Segment viewer, cohort analysis |
| New: Meeting Mode view | Board presentation packet with export |

### Architecture Deliverables

| Component | Upgrade |
|-----------|---------|
| Customer pipeline | ETL for buyer purchase history |
| Performance | Edge caching, ISR for static screens |
| Monitoring | Datadog/Sentry for dashboard performance |

### New KPIs Supported

| KPI | Note |
|-----|------|
| C1 — Total Buyers | Requires Buyer App endpoint |
| C2 — New Buyer Acquisition | Requires Buyer App endpoint |
| C3 — Repeat Buyer Rate | Requires Buyer App endpoint |
| All P2 KPIs from KPI Inventory | By V4, all KPIs should be measurable |

### V4 Success Criteria

- [ ] Customer segmentation identifies 5+ meaningful segments
- [ ] Meeting mode generates board-ready PDF in < 30 seconds
- [ ] p95 dashboard load time < 1s (with caching)
- [ ] 99.5% dashboard uptime (measured monthly)
- [ ] All KPIs from KPI Inventory measurable (including P2)
- [ ] Documentation complete for all phases

---

## 7. Dependency Map

```
MVP (V1)                        V2                              V3                              V4
────────                        ──                              ──                              ──

Payments API ──┬──→ Executive      Buyer Admin API ──→ Customer   Settlement Data ──→ What-If    Per-Buyer API ──→ Customer
                │    Overview       Endpoint            Analytics                 Simulation      Endpoint            Segmentation
                │
Settlements ────┼──→ Finance       Seller Admin ────→ Seller       Historical Data ──→ Root      All Features ──→ Meeting
API              │    Dashboard     Endpoint            Analytics     (6+ months)       Cause      Ready               Mode
                 │                                                                     Analysis
Products API ───┼──→ Product      Shipping Admin ───→ Operations
                 │    Analytics     Endpoint            Dashboard
                 │
Shipments API ──┘                  LLM Provider ────→ AI Copilot   PDF Library ────→ Reports

                                   3 months data ──→ Forecasting +
                                                      Anomaly Detection
```

---

## 8. Effort Summary

| Phase | Weeks | Screens | AI Features | Architecture Work | Team Size |
|-------|-------|---------|-------------|-------------------|-----------|
| MVP | 6 | 5-6 | 0 | Service clients, UI, caching | 2 devs |
| V2 | 8 | 4 (new) + 3 (enhanced) | 5 | AI infra, polling, 4-app integration | 2-3 devs |
| V3 | 8 | All enhanced | 3 | PDF, email, what-if engine | 2 devs |
| V4 | 8 | 1 (new) + all enhanced | 2 | Customer pipeline, performance | 1-2 devs |
| **Total** | **30** | **10 screens** | **10 features** | — | — |

---

## 9. Risk Register

| Risk | Phase | Likelihood | Impact | Mitigation |
|------|-------|------------|--------|------------|
| Buyer/Seller admin endpoints never built | V2 | Medium | High | Accept ASSUMPTION; fall back to Payments-only data |
| LLM costs exceed budget | V2 | Medium | Medium | Rate limiting, caching common queries, token budget |
| Source API rate limits block dashboard | V1 | Low | High | Aggressive caching, backoff, admin notification |
| Cross-reference joins too slow | V2 | Medium | Medium | Pre-compute in analytics DB (V2+) |
| Stakeholders want mutations (approve payouts, etc.) | V1 | High | Low | Clearly scope MVP as read-only; V2+ add mutation with strict permissions |
| Existing Payments dashboard makes this redundant | V1 | Low | Medium | Differentiate: cross-app insights, AI, multi-dimensional analytics |
