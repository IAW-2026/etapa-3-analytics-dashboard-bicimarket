# 7 — Roadmap

> **Manager Dashboard — Product Roadmap**
>
> Phased delivery plan from MVP through V3, mapping features, screens, KPI support, and architectural investments to each phase.

---

## 1. Delivery Philosophy

| Principle | Rationale |
|-----------|-----------|
| **Working dashboard in 6 weeks** | MVP must deliver value fast to validate the investment |
| **Read-only MVP** | No mutations = lower risk, faster delivery |
| **P0 KPIs first** | Revenue, orders, success rate — the essentials |
| **Data source gaps deferred** | If an API doesn't exist, MVP works around it (ASSUMPTION) |
| **AI comes after data** | Copilot requires reliable data foundation |

---

## 2. Phase Overview

```
Phase         Timeline     Focus                         Key Deliverables
───────────────────────────────────────────────────────────────────────────
MVP (V1)      Weeks 1-6    Core KPIs + AI Foundation     Payments data, 8 screens, F1 (NLQ) complete
V2            Weeks 7-14   AI Insights                   F2 (Chart Explanation), F4 (Forecasting)
V3            Weeks 15-22  Advanced Analysis             F6 (What-If), F8 (Root Cause Analysis)
```

---

## 3. MVP (V1) — Core KPIs + AI Foundation

### Goal
Deliver a working executive dashboard focused on revenue, orders, and financial KPIs with a fully-featured AI Copilot for natural language querying.

### Why Payments-first
- Payments App has the most complete GET endpoints with filters
- Revenue data is the highest-priority KPI for executives

### Screens Delivered

| Screen | Priority | Data Source | Est. Effort |
|--------|----------|-------------|-------------|
| 4.1 Executive Overview | P0 | Payments | 1 week |
| 4.2 Sales Analytics | P0 | Payments | 1 week |
| 4.4 Finance Dashboard | P0 | Payments | 1 week |
| 4.3 Operations Dashboard | P1 | Payments + Seller | 1.5 weeks |
| 4.6 Product Analytics (basic) | P1 | Payments (items_summary) | 1 week |
| 4.7 Seller Analytics (basic) | P1 | Payments (settlements) | 1 week |

### Screens Deferred to V2

| Screen | Reason |
|--------|--------|
| 4.5 Customer Analytics | Requires Buyer App admin endpoint (not documented) |

### AI Features Delivered (V1)

| Feature | Est. Effort | Dependencies |
|---------|-------------|--------------|
| F1 — Natural Language Query (complete) | 4 weeks | Tool registry, LLM provider, RAG pipeline, 12 tools |

F1 includes: streaming chat with 12 tools, RAG for business context (KPI definitions, endpoint docs), prompt-based intent classifier, inline data visualizations, active dashboard filter context, multi-step tool chaining (maxSteps=5).

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
| Service clients | Payments, Seller, Buyer clients |
| AI infra | Vercel AI SDK integration, tool registry, RAG pipeline |
| State management | Zustand for dashboard filters |

### Data Source Gaps (MVP)

| Gap | Impact | Mitigation |
|-----|--------|------------|
| No batch Buyer App endpoint | Customer metrics unavailable | Defer to V2 |
| No batch Shipping App endpoint | Limited shipment metrics | Tools requiring these endpoints not implemented |
| Cross-reference metrics | Not available | Payments-first approach |

---

## 4. V2 — AI Insights

### Goal
Add chart explanations and revenue forecasting. Build on the F1 foundation to make every visualization explainable and add predictive capabilities.

### Prerequisites
- [ ] LLM API keys configured and budget approved
- [ ] Minimum 3 months of historical payment data accumulated

### New Screens

| Screen | Priority | Notes |
|--------|----------|-------|
| 4.5 Customer Analytics | P1 | Requires Buyer App admin endpoint |

### AI Features Delivered

| Feature | Est. Effort | Dependencies |
|---------|-------------|--------------|
| F2 — Chart Explanation | 0.5 weeks | None (client-side data) |
| F4 — Revenue Forecasting | 2 weeks | Historical data (> 3 months) |

### Architecture Deliverables

| Component | Upgrade from MVP |
|-----------|-----------------|
| Service clients | Buyer client implemented (if endpoint exists) |

### New KPIs Supported

| KPI | Data Source |
|-----|-------------|
| R3 — Revenue by Seller | Settlements grouped by seller |
| R6 — Effective Take Rate | Settlement fee/gross ratio |
| O5 — Payment Failure by Reason | Payment attempts |
| O7 — Refund by Reason | Refund reason field |
| F2 — Settlement Velocity | Settlement + payout timestamps |

### V2 Success Criteria

- [ ] Chart explanation works on all visualizations
- [ ] Revenue forecast available and within ±20% accuracy
- [ ] F1 handles 10+ common business questions correctly with RAG context
- [ ] Dashboard users can ask follow-up questions maintaining conversation context

---

## 5. V3 — Advanced Analysis

### Goal
Advanced analytics with what-if modeling and automated root cause analysis.

### Prerequisites
- [ ] Minimum 6 months of historical data accumulated

### New Features

| Feature | Est. Effort | Dependencies |
|---------|-------------|--------------|
| F6 — What-If Analysis | 1 week | Settlement data |
| F8 — Root Cause Analysis | 2.5 weeks | Historical data, multi-step tool chaining |

### Screen Enhancements

| Screen | Enhancement |
|--------|-------------|
| 4.4 Finance Dashboard | Add what-if simulator panel for commission modeling |
| 4.2 Sales Analytics | Add root cause analysis button ("Why did sales drop?") |

### Architecture Deliverables

| Component | Upgrade |
|-----------|---------|
| What-if engine | Server-side simulation functions |
| Root cause engine | Multi-step investigation tree with maxSteps |

### New KPIs Supported

| KPI | Note |
|-----|------|
| All P1 KPIs from KPI Inventory | By V3, all P1 KPIs should be available |
| Seller Revenue Ranking | Enhanced seller analytics |

### V3 Success Criteria

- [ ] What-if analysis answers "what if we change commission to X%" in < 3 seconds
- [ ] Root cause analysis correctly identifies metric drop causes in > 70% of test cases
- [ ] All KPIs displayed across all screens

---

## 6. Dependency Map

```
MVP (V1)                        V2                              V3
────────                        ──                              ──

Payments API ──┬──→ Executive      Buyer Admin API ──→ Customer   3 months data ──→ Forecasting
                │    Overview       Endpoint            Analytics
                │
Settlements ────┼──→ Finance       Historical ───────→ Forecasting  Settlement Data ──→ What-If
API              |    Dashboard     Data (3+ months)                 Simulation
                 |
Products API ───┼──→ Product      LLM Provider ────→ AI Copilot   6 months data ──→ Root Cause
                 |    Analytics     + RAG Pipeline     (F1 complete)                  Analysis
                 |
Sales Orders ───┘                 Chart Data ───────→ Chart
API                                                  Explanation (F2)
```

---

## 7. Effort Summary

| Phase | Weeks | Screens | AI Features | Architecture Work | Team Size |
|-------|-------|---------|-------------|-------------------|-----------|
| MVP | 6 | 5-6 | 1 (F1) | Service clients, UI, AI infra, RAG | 2 devs |
| V2 | 8 | 1 (new) | 2 (F2, F4) | Buyer integration (if endpoint exists) | 2 devs |
| V3 | 8 | All enhanced | 2 (F6, F8) | What-if engine, root cause engine | 2 devs |
| **Total** | **22** | **7 screens** | **5 features** | — | — |

---

## 8. Risk Register

| Risk | Phase | Likelihood | Impact | Mitigation |
|------|-------|------------|--------|------------|
| Buyer/Seller admin endpoints never built | V2 | Medium | High | Accept ASSUMPTION; fall back to Payments-only data |
| LLM costs exceed budget | V1 | Medium | Medium | Rate limiting, caching common queries, token budget |
| Source API rate limits block dashboard | V1 | Low | High | Aggressive caching, backoff, admin notification |
| Stakeholders want mutations (approve payouts, etc.) | V1 | High | Low | Clearly scope as read-only |
| Existing Payments dashboard makes this redundant | V1 | Low | Medium | Differentiate: cross-app insights, AI, multi-dimensional analytics |
