# 2.3 — Use Cases

> **Manager Dashboard — Product Design**
>
> Detailed use case scenarios for the Manager Dashboard, organized by business question.

---

## UC1 — Executive Morning Briefing

**Persona**: Executive
**Trigger**: First login of the day
**Frequency**: Daily

**Scenario**:
An executive logs into the dashboard at 9 AM. The AI automatically generates a daily briefing showing:
- Yesterday's revenue vs. the same day last week
- Orders placed, paid, and delivered in the last 24 hours
- Any anomalies detected (e.g., "Payments are 30% below rolling 7-day average")
- Pending settlements requiring attention
- Refund rate changes

**Expected Outcome**: Executive understands marketplace health in < 30 seconds and knows what needs attention.

**Data Required**:
- `GET /api/v1/payments?from=yesterday&to=today`
- `GET /api/v1/settlements?status=pending`
- `GET /api/v1/refunds?from=yesterday&to=today`

---

## UC2 — "Why did sales drop this week?"

**Persona**: Executive / Marketing Manager
**Trigger**: Weekly revenue review shows decline
**Frequency**: Ad-hoc

**Scenario**:
A manager sees that revenue is 15% below the previous week. They ask the AI: "Why did sales drop this week?" The system analyzes:
1. Payment success rate changes (more failures?)
2. Order volume changes (fewer orders?)
3. Average order value changes (smaller orders?)
4. Specific seller/category declines
5. Date comparison (was last week unusually high?)

**Expected Outcome**: Identify root cause — e.g., "A top seller had a technical issue and didn't receive orders for 2 days."

**Data Required**:
- `GET /api/v1/payments` (compare two periods)
- `GET /api/v1/settlements` (per seller breakdown)
- `GET /api/v1/refunds` (abnormal refund activity)

---

## UC3 — "Which products generate the most revenue?"

**Persona**: Marketing Manager
**Trigger**: Product strategy planning
**Frequency**: Weekly

**Scenario**:
The marketing team wants to identify top-performing products for a promotion campaign. The dashboard shows:
- Top 10 products by revenue (from payment items_summary)
- Top 10 products by volume (units sold)
- Category breakdown of top performers
- Price distribution of best sellers

**Expected Outcome**: Data-driven product promotion decisions.

**Data Required**:
- `GET /api/v1/payments` (items_summary for product-level data)
- `GET /api/v1/products` (category and product details)

---

## UC4 — "Which customers are at risk of churn?"

**Persona**: Customer Experience Manager
**Trigger**: Proactive customer retention
**Frequency**: Weekly

**Scenario**:
A CX manager wants to identify buyers who had a negative experience. The dashboard identifies:
- Buyers with rejected payments (tried to buy but couldn't pay)
- Buyers who received refunds due to seller rejection or delivery failure
- Buyers who haven't made a second purchase within 30 days

**Expected Outcome**: Proactive outreach to at-risk customers.

**Data Required**:
- `GET /api/v1/payments` (filter by rejected status, group by buyer)
- `GET /api/v1/refunds` (filter by reason, group by buyer)

> **ASSUMPTION**: No documented endpoint exposes buyer email/contact for the dashboard. A new Buyer App endpoint or admin-level access to buyer profiles would be needed.

---

## UC5 — "Which categories are growing fastest?"

**Persona**: Marketing Manager
**Trigger**: Strategic planning
**Frequency**: Monthly

**Scenario**:
The marketing team wants to identify category trends. The dashboard shows:
- Month-over-month revenue growth by category
- New product listings by category
- Category share of total marketplace revenue
- Price trends by category

**Expected Outcome**: Identify high-growth categories for strategic investment.

**Data Required**:
- `GET /api/v1/payments` (items_summary with product IDs)
- `GET /api/v1/products` (category mapping)
- Time-series aggregation by month

---

## UC6 — "Which promotions performed best?"

**Persona**: Marketing Manager
**Trigger**: Post-promotion analysis
**Frequency**: Per promotion cycle

**Scenario**:
After running a discount campaign, the manager wants to evaluate its impact:
- Sales volume during promotion vs. baseline
- Revenue attributed to promoted products
- New buyers acquired during promotion
- Refund rate on promoted products

**Expected Outcome**: Determine promotion ROI and inform future campaigns.

**Data Required**:
- `GET /api/v1/payments` (date range analysis)
- `GET /api/v1/products` (promoted product IDs)

> **ASSUMPTION**: No promotion or campaign tracking exists in the documented system. This would require manual date-based analysis or a future promotion module.

---

## UC7 — "Are there operational bottlenecks?"

**Persona**: Operations Manager
**Trigger**: Daily operations review
**Frequency**: Daily

**Scenario**:
An operations manager checks the dashboard and sees:
- 15 sales_orders pending seller acceptance (sellers not responding)
- 8 shipments ready for pickup but not assigned to operators
- 3 deliveries failed yesterday (need investigation)
- Average acceptance time increasing week-over-week

**Expected Outcome**: Identify and resolve bottlenecks before they affect customer experience.

**Data Required**:
- `GET /api/v1/sales-orders` (filter by status)
- `GET /api/v1/shipments` (filter by status)

> **ASSUMPTION**: Batch shipment listing and sales order listing across all sellers require admin-level endpoints not documented for Seller and Shipping apps.

---

## UC8 — "Generate a monthly financial report"

**Persona**: Finance Manager
**Trigger**: Month-end close
**Frequency**: Monthly

**Scenario**:
The finance manager needs to generate a report including:
- Total GMV for the month
- Total marketplace commission earned
- Total paid to sellers (net settlements)
- Refund amounts and rates
- Pending settlement liability
- Month-over-month growth

The AI generates a structured report with charts, tables, and key takeaways.

**Expected Outcome**: Ready-to-present monthly financial summary in < 1 minute.

**Data Required**:
- `GET /api/v1/payments` (month range)
- `GET /api/v1/settlements` (month range)
- `GET /api/v1/payouts` (month range)
- `GET /api/v1/refunds` (month range)

---

## UC9 — "Forecast next month's revenue"

**Persona**: Executive / Finance Manager
**Trigger**: Budget planning
**Frequency**: Monthly

**Scenario**:
Using historical payment data, the system generates a revenue forecast for the next 30 days, showing:
- Expected daily revenue range
- Upper and lower confidence bounds
- Seasonal adjustment (based on same month last year)
- Key assumptions and risk factors

**Expected Outcome**: Data-driven revenue projections for planning.

**Data Required**:
- `GET /api/v1/payments` (last 6-12 months for trend analysis)

---

## UC11 — "Explain this chart"

**Persona**: All users
**Trigger**: While viewing dashboard
**Frequency**: Ad-hoc

**Scenario**:
While viewing the revenue trend chart, a manager clicks "Explain this chart." The AI analyzes the chart and provides:
- Key trends and patterns
- Notable peaks and valleys with likely causes
- Comparison with previous periods
- Statistical summary (mean, median, min, max, trend direction)
- Actionable insights

**Expected Outcome**: Immediate understanding of any visualization without manual analysis.

**Data Required**:
- The chart's underlying data (already loaded in the UI)

---

## UC12 — "What if we increase seller commission to 12%?"

**Persona**: Executive / Finance Manager
**Trigger**: Business model optimization
**Frequency**: Ad-hoc

**Scenario**:
An executive wants to model the impact of increasing marketplace commission from 10% to 12%. The what-if simulator:
- Takes current settlement data
- Recalculates fees at 12%
- Shows projected additional revenue
- Shows impact on seller net payouts
- Estimates potential seller churn risk (based on assumed sensitivity)

**Expected Outcome**: Data-driven pricing decisions.

**Data Required**:
- `GET /api/v1/settlements` (current fee structure)

> **ASSUMPTION**: This is a simulation — no actual data changes. Seller churn sensitivity is an assumption.


