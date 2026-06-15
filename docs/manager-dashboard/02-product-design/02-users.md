# 2.2 — Users & Roles

> **Manager Dashboard — Product Design**
>
> User personas, roles, and access patterns for the Manager Dashboard.

---

## 1. User Roles

The Manager Dashboard reuses the existing Clerk authentication model. No new roles are needed for MVP.

| Role | Clerk Metadata | Dashboard Access | Mutations |
|------|---------------|------------------|-----------|
| Admin | `publicMetadata.admin = true` | Full read access to all data | None (MVP) |
| Manager | `publicMetadata.admin = true` | Full read access to all data | None (MVP) |

> **Note**: The documented system does not differentiate between "admin" and "manager" — both use `publicMetadata.admin = true`. Role differentiation is a future concern if the dashboard adds mutation capabilities (e.g., approving payouts, managing sellers).

---

## 2. User Personas

### Persona 1: Executive (CEO / COO)

| Attribute | Detail |
|-----------|--------|
| **Name** | Martín |
| **Role** | Chief Executive Officer |
| **Technical level** | Low — comfortable with charts and numbers, not technical |
| **Frequency** | Daily (morning briefing) + ad-hoc during day |
| **Primary need** | "Is the marketplace healthy? What needs my attention?" |
| **Key screens** | Executive Overview, AI Copilot |
| **Key KPIs** | GMV, revenue trend, pending settlements, anomalies |
| **Pain points** | Currently gets status from Slack snippets his team sends him |

**Scenario**: Martín opens the dashboard at 9 AM. The AI shows yesterday's revenue was ARS 2.3M (+12% WoW), 45 orders were processed (98% success rate), and 3 anomalies need review. He spends 30 seconds getting the full picture.

### Persona 2: Finance Manager

| Attribute | Detail |
|-----------|--------|
| **Name** | Lucía |
| **Role** | Finance Manager |
| **Technical level** | Medium — comfortable with spreadsheets and financial tools |
| **Frequency** | Daily (settlement review) + weekly (reporting) |
| **Primary need** | "Are settlements being paid on time? What's our pending liability?" |
| **Key screens** | Finance Dashboard, Settlements, Payouts |
| **Key KPIs** | Commission revenue, pending settlements, payout velocity, refund rate |
| **Pain points** | Manually cross-references settlements vs payouts in Excel |

**Scenario**: Lucía checks the Finance Dashboard every morning. She sees ARS 850K in pending settlements, 3 payouts that failed processing, and the monthly commission revenue tracking at ARS 1.2M. She generates a monthly report with one click.

### Persona 3: Operations Manager

| Attribute | Detail |
|-----------|--------|
| **Name** | Carlos |
| **Role** | Operations Manager |
| **Technical level** | Medium |
| **Frequency** | 2-3 times per day |
| **Primary need** | "Are orders being fulfilled on time? Where are the bottlenecks?" |
| **Key screens** | Operations Dashboard, Seller Analytics |
| **Key KPIs** | Fulfillment rate, average delivery time, seller acceptance rate, pending shipments |
| **Pain points** | Currently checks Seller and Shipping apps separately to find bottlenecks |

**Scenario**: Carlos sees that 15 sales orders are pending seller acceptance (up from 5 yesterday). He drills into the seller list and sees that 2 sellers have 80% of pending orders. He contacts them via the platform.

### Persona 4: Marketing Manager

| Attribute | Detail |
|-----------|--------|
| **Name** | Sofía |
| **Role** | Marketing Manager |
| **Technical level** | Medium |
| **Frequency** | Weekly + campaign-specific |
| **Primary need** | "Which products and categories are driving revenue? What are the trends?" |
| **Key screens** | Sales Analytics, Product Analytics, Customer Analytics |
| **Key KPIs** | Revenue by category, top products, customer acquisition, growth rate |
| **Pain points** | Asks developers for custom SQL queries to get product-level data |

**Scenario**: Sofía is planning a promotion. She asks the AI Copilot "Which MTB products are top sellers?" The AI shows top 10 MTB products by revenue and suggests that the "MTB" category grew 22% this month — a good candidate for promotion.

### Persona 5: Customer Experience Manager

| Attribute | Detail |
|-----------|--------|
| **Name** | Ana |
| **Role** | Customer Experience Manager |
| **Technical level** | Low |
| **Frequency** | Daily |
| **Primary need** | "Which customers are having problems? What's our refund and delivery situation?" |
| **Key screens** | Customer Analytics, Operations Dashboard |
| **Key KPIs** | Refund rate, delivery issues, at-risk customers |
| **Pain points** | Finds out about problems when customers complain, not proactively |

**Scenario**: Ana spots that 3 deliveries failed yesterday in the same postal code area. She investigates and finds a logistics operator issue in that zone.

---

## 3. Access Patterns

| Pattern | Description |
|---------|-------------|
| **Morning briefing** | First login of the day — AI-generated summary of overnight activity |
| **Ad-hoc query** | User asks a specific question — "How was revenue last week?" |
| **Periodic review** | Weekly/monthly deep-dive into specific metrics |
| **Alert-driven** | Anomaly notification pulls user into dashboard |
| **Report generation** | Scheduled or on-demand PDF report creation |

---

## 4. Authentication Flow

```
1. User visits /dashboard
2. Clerk middleware checks session
3. If not authenticated → redirect to Clerk login
4. If authenticated → check publicMetadata.admin
5. If not admin → show 403 "Access denied"
6. If admin → show dashboard with all data
```

**Technical note**: The Manager Dashboard should ensure the Clerk session includes the admin metadata. If the existing Clerk project already propagates `publicMetadata` in the session token, no changes are needed. If not, a server-side check against Clerk's API may be required.
