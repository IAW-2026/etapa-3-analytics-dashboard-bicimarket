"use client"

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProductMetrics, useTopProductsByRevenue } from "@/hooks/use-dashboard-data"

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-chart-5)", "var(--color-chart-4)", "var(--color-chart-3)"]

function formatARS(cents: number) {
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function ProductAnalyticsPage() {
  const productMetrics = useProductMetrics()
  const topProducts = useTopProductsByRevenue()

  const pm = productMetrics.data
  const topRev = topProducts.data?.slice(0, 10) ?? []
  const topVol = topProducts.data ? [...topProducts.data].sort((a, b) => b.units - a.units).slice(0, 10) : []

  const maxRevenue = topRev[0]?.revenue ?? 1
  const byCategory = pm?.by_category ?? []
  const byCondition = pm?.by_condition ?? []
  const categoryRevenueData = byCategory.map((c) => ({ ...c, label: c.category.charAt(0).toUpperCase() + c.category.slice(1) }))

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Product Analytics" description="Product performance, categories, and catalog health" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active Products" value={pm ? pm.total.toLocaleString("es-AR") : "—"} trend={{ value: "+12% MoM", direction: "up" }} isLoading={productMetrics.isLoading} />
        <KpiCard label="Avg Price" value={pm ? formatARS(pm.avg_price_cents) : "—"} trend={{ value: "-2% MoM", direction: "down", positive: true }} isLoading={productMetrics.isLoading} />
        <KpiCard label="Items/Order" value="2.3" trend={{ value: "+5% MoM", direction: "up" }} isLoading={productMetrics.isLoading} />
        <KpiCard label="Categories" value={pm ? String(pm.categories_count) : "—"} isLoading={productMetrics.isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Top 10 Products by Revenue" isLoading={topProducts.isLoading} error={topProducts.error?.message} isEmpty={topRev.length === 0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topRev.map((prod, idx) => {
                const total = topRev.reduce((s, p) => s + p.revenue, 0)
                const share = total > 0 ? (prod.revenue / total) * 100 : 0
                return (
                  <TableRow key={prod.product_id}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm font-medium">{prod.name}</TableCell>
                    <TableCell className="text-sm">{formatARS(prod.revenue)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-chart-1" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{share.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ChartContainer>

        <ChartContainer title="Top 10 Products by Volume" isLoading={topProducts.isLoading} error={topProducts.error?.message} isEmpty={topVol.length === 0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Units Sold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topVol.map((prod, idx) => (
                <TableRow key={prod.product_id}>
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm font-medium">{prod.name}</TableCell>
                  <TableCell className="text-sm">{prod.units}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ChartContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartContainer title="Revenue by Category" isLoading={productMetrics.isLoading} error={productMetrics.error?.message} isEmpty={categoryRevenueData.length === 0}>
          <div className="space-y-3">
            {categoryRevenueData.slice(0, 6).map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{cat.label}</span>
                  <span className="text-muted-foreground">{cat.count} products</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-chart-2 transition-all" style={{ width: `${(cat.count / (pm?.total ?? 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer title="Catalog Composition" isLoading={productMetrics.isLoading} error={productMetrics.error?.message} isEmpty={byCondition.length === 0}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byCondition} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="condition" label={({ name, value }) => `${name} (${value})`}>
                {byCondition.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Category Revenue Trend" isLoading={false}>
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            <p>Select a category to view its revenue trend over time.</p>
          </div>
        </ChartContainer>
      </div>
    </div>
  )
}
