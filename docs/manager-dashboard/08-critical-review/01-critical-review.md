# 8 — Critical Review

> **Manager Dashboard — Critical Analysis**
>
> An honest assessment of gaps, risks, and architectural weaknesses in both the existing BiciMarket system and the proposed Manager Dashboard design.

---

## 1. Data Source Gaps

### 1.1 Missing Admin-Level Endpoints

The single largest risk to the Manager Dashboard is the absence of admin/batch-level endpoints in the Buyer, Seller, and Shipping apps.

| Missing Endpoint | Impact | Workaround | Feasibility |
|-----------------|--------|------------|-------------|
| `GET /api/v1/admin/orders` (Buyer) | Cannot list all orders across all buyers | Derive order data from Payments App payments (order_id + amount_cents) | **Partial** — loses order items, buyer info, status history |
| `GET /api/v1/admin/buyers` (Buyer) | Cannot show buyer count, acquisition trends, repeat rate | Not possible without this endpoint | **None** — customer KPIs blocked |
| `GET /api/v1/seller-profiles` (Seller) | Cannot list all sellers, verification status | Derive seller IDs from settlements data only | **Partial** — no seller names, verification status |
| `GET /api/v1/admin/sales-orders` (Seller) | Cannot aggregate fulfillment across sellers | Derive from Payments items_summary? | **Poor** — items_summary doesn't contain fulfillment status |
| `GET /api/v1/shipments` without `orderId` (Shipping) | Cannot list all shipments, compute aggregate delivery metrics | Shipment-level aggregation impossible | **None** — operations KPIs blocked |
| `GET /api/v1/admin/products` across sellers (Seller) | Cannot get full catalog view | Use per-seller iteration if seller list available | **Slow** — N+1 API calls |

### 1.2 Cross-Reference Data

| Join | Available | Method | Reliability |
|------|-----------|--------|-------------|
| Payment → Buyer | `payment.buyer_profile_id` | Direct field | ✔️ Yes |
| Payment → Seller | `payment.items_summary[].seller_profile_id` | JSON array of seller groups | ✔️ Yes — confirmed from real data |
| Payment → Product | `items_summary[].items[].product_id` | JSON array → items array | ✔️ Yes — confirmed from real data |
| Payment → Order | `payment.order_id` | Direct field | ✔️ Yes |
| Settlement → Seller | `settlement.seller_profile_id` | Direct field | ✔️ Yes |
| Sales Order → Order | `sales_order.order_id` | Direct field | ✔️ Yes (Seller App) |
| Sales Order → Shipment | `order_id + seller_profile_id` | Implicit | ⚠️ — no documented cross-reference |

### 1.3 Items Summary Structure (Confirmed)

The `items_summary` field on the Payment model is critical for cross-reference metrics. Its structure has been confirmed from a real payment record:

```json
[
  {
    "seller_profile_id": "slp_...",
    "order_seller_group_id": "osg_...",
    "items": [
      {
        "product_id": "prd_...",
        "product_name_snapshot": "Bicicleta MTB Trek Procaliber 8 2026",
        "unit_price_cents": 390000000,
        "quantity": 1
      }
    ],
    "subtotal_cents": 390000000,
    "shipping_cost_cents": 1400000
  }
]
```

**Key facts**:
- `items_summary` is a **JSON array** at the top level (list of seller groups), not an object with a `sellers` key
- Each seller group contains: `items` (array), `subtotal_cents`, `seller_profile_id`, `shipping_cost_cents`, `order_seller_group_id`
- Each item contains: `product_id`, `product_name_snapshot`, `unit_price_cents`, `quantity`
- No `commission_cents` at the per-seller level in `items_summary` — commission is stored only in the `settlements` entity

---

## 2. Architectural Weaknesses

### 2.1 No Event Bus

The absence of an event bus means:
- **No guaranteed delivery**: REST PATCH calls can fail silently
- **No replay**: Missed notifications cannot be replayed
- **No ordering**: Status updates may arrive out of sequence
- **Dashboard staleness**: The dashboard polls, but the source data may be stale if inter-app notifications fail

**Impact on Manager Dashboard**: The dashboard may show inconsistent data (e.g., payment marked "approved" but the corresponding sales_order was never created because the PATCH to Seller App failed).

### 2.2 Polling vs Push

The dashboard relies on polling (every 60s-5min). This means:
- Data is always behind real-time by at least the polling interval
- High polling frequency increases load on source apps
- No way to get instant updates (e.g., a payment just arrived)

### 2.3 N+1 API Call Problem

For seller-level or product-level analytics, the dashboard may need to:

```
For each seller (N):
  Call GET /api/v1/settlements?sellerId=X
  Call GET /api/v1/products?seller_id=X
```

With 50 sellers, that's 100 extra API calls per dashboard load.

### 2.4 Single Point of Failure Per App

If any of the 4 source apps is down:
- Payments App down → No revenue data, no financial KPIs
- Buyer App down → No customer data (but MVP can work around)
- Seller App down → No product data
- Shipping App down → No operations data

---

## 3. Authentication & Authorization Gaps

### 3.1 Service Token Provisioning

The dashboard needs its own `X-Service-Token` for each of the 4 apps. Questions:
- Who provisions these tokens?
- Do the tokens have admin-level access to all endpoints?
- Can tokens be scoped (read-only, specific endpoints)?
- How are tokens rotated?

**Current state**: Not documented for any app.

### 3.2 User-Role Granularity

The Clerk model has a single `publicMetadata.admin = true` flag. This means:
- All admins see ALL data (revenue, settlements, customer info)
- No role-based access (e.g., finance vs operations vs marketing)
- No way to restrict a manager to "read-only" vs "can approve payouts"

**If mutations are added in V2+**, the current role model is insufficient.

---

## 4. Missing Business Logic in Source Apps

### 4.1 No Promotion/Campaign Tracking

The use cases include promotion analysis (UC6), but the source apps have no promotion entity. There is no way to:
- Tag products as "on promotion"
- Track promotion period start/end
- Measure promotion lift vs baseline

**Dashboard impact**: UC6 can only be approximated by manual date-range analysis.

### 4.2 No Seller Activity Tracking

Seller churn analysis requires knowing when sellers were last active (logged in, updated products, fulfilled orders). This data does not appear to be tracked.

**Dashboard impact**: Seller retention insights are not possible.

### 4.3 No Cart Abandonment

The `abandoned` cart status was removed from the schema. Full conversion funnel analysis (view cart → checkout → payment) is not possible.

**Dashboard impact**: UC4 (at-risk customers) and funnel metrics are degraded.

### 4.4 No Product Cost Data

Product profitability (revenue - cost) is not calculable because product cost is not stored anywhere in the system.

**Dashboard impact**: Only revenue-side analytics are possible, not profit.

---

## 5. Technical Debt in Existing Apps

### 5.1 Seller App — Non-Propagated Request ID (ADR-005 violation)

> From 01-existing-apps.md: "Seller App generates a new UUID for each outgoing call instead of propagating the incoming X-Request-Id"

This means tracing a request across the system is difficult. The Manager Dashboard cannot reliably correlate its own requests with inter-app requests.

### 5.2 Payments App — Disabled Inter-App Notifications

> From 01-existing-apps.md: "Notifications are marked as 'commented' in the documentation — implemented but currently disabled."

If payments notifications are disabled, the Buyer and Seller apps may have stale data. The dashboard polling may reveal inconsistencies.

### 5.3 Seller App — Missing Notification on Order Acceptance

> From 01-existing-apps.md: "Seller App does NOT notify Buyer App with PATCH /api/v1/orders/{id}/seller-groups/{g}/status when accepting an order"

This means the Buyer App may show orders as "pending seller acceptance" even after the seller has accepted. The dashboard consuming Buyer App data would show the same stale state.

---

## 6. Performance Risks

| Risk | Scenario | Impact | Mitigation |
|------|----------|--------|------------|
| Large product catalog | 10,000+ products | `GET /api/v1/products` returns large payload, slow pagination | Cache aggressively, paginate with limit=100 |
| High-frequency polling | Dashboard polls every 30s | Source apps may experience increased load | Use longer intervals for non-critical data |
| Cross-join queries | Revenue by product for 6 months | Client-side processing of thousands of payments is slow | Pre-compute in analytics DB (V2) |
| AI Copilot latency | Complex query requiring 3+ tool calls | Response time > 10s | Show intermediate steps, use streaming |

---

## 7. Compliance & Data Concerns

| Concern | Issue | Recommendation |
|---------|-------|---------------|
| PII exposure | Dashboard may show buyer/seller names, email if endpoints expose them | Implement field-level access control; mask PII by default |
| Financial data accuracy | Revenue must match actual bank deposits | Add reconciliation view; compare payment amounts vs MP settlement amounts |
| Data retention | How long is dashboard data stored? | Define retention policy (e.g., raw data 90d, aggregated data forever) |
| Audit trail | Who accessed what data and when? | Log all dashboard API requests with user ID, timestamp, and query |

---

## 8. Recommendations

### Critical (Blocking MVP)

| # | Recommendation | Rationale |
|---|---------------|-----------|
| R1 | ~~Confirm `items_summary` schema structure~~ **Resolved** — structure confirmed as JSON array of seller groups | No longer blocking |
| R2 | Provision dashboard-specific `X-Service-Token` in all 4 apps | Without tokens, the dashboard cannot authenticate |
| R3 | Decide: build admin endpoints in other apps, or accept ASSUMPTION status | Without buyer/seller/shipping admin endpoints, the dashboard is a Payments-only dashboard |
| R4 | Add `GET /api/v1/admin/payments` or confirm existing endpoint works for admin | The dashboard must list all payments, not just one user's |

### High Priority (V1-V2)

| # | Recommendation | Rationale |
|---|---------------|-----------|
| R5 | Implement a lightweight event bus (or use Supabase Realtime) | Eliminates polling, enables real-time updates |
| R6 | Re-enable Payments App inter-app notifications | Ensures data consistency across apps |
| R7 | Add role-based access to Clerk (admin_readonly, admin_finance, admin_ops) | Enables fine-grained dashboard permissions |
| R8 | Define service token scope (read-only for dashboard) | Security best practice |

### Medium Priority (V3+)

| # | Recommendation | Rationale |
|---|---------------|-----------|
| R9 | Add promotion/campaign entity to relevant app | Enables promotion analytics (UC6) |
| R10 | Add seller activity tracking (last_login, last_fulfillment) | Enables churn analysis |
| R11 | Add cart `abandoned` status back to schema | Enables funnel analytics |
| R12 | Implement consistent X-Request-Id propagation across all apps | Enables end-to-end tracing |
| R13 | Add `GET /api/v1/shipments` batch endpoint (without required orderId) | Enables shipment-level aggregation |

---

## 9. Conclusion

The Manager Dashboard is **feasible for MVP** if scoped to Payments App data only, but its value is **significantly limited** by missing admin endpoints in the Buyer, Seller, and Shipping apps.

**If only payments data is available**, the dashboard delivers:
- Revenue analytics (GMV, daily revenue, growth rates)
- Financial oversight (settlements, commissions, refunds)
- Basic seller metrics (from settlement data)

**Without admin endpoints in other apps**, the dashboard cannot deliver:
- Customer analytics (acquisition, retention, segments)
- Full product analytics (revenue by product/category)
- Operations analytics (fulfillment rates, delivery times)
- Seller management (seller listing, verification status)

**The AI Copilot** (V2) is viable even with payments-only data, as natural language query over financial data is valuable. However, "why did sales drop?" requires cross-app data.

**The single highest-impact action** the team can take is to provision admin/batch GET endpoints in the Buyer, Seller, and Shipping apps. This unlocks 80% of the dashboard's potential value.
