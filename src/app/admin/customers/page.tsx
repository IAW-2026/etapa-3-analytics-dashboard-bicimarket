"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ChartContainer } from "@/components/analytics/chart-container"
import { SectionHeader } from "@/components/analytics/section-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { useRevenueByMethod } from "@/hooks/use-dashboard-data"

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

function formatARS(cents: number) {
  return `ARS ${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`
}

export default function CustomerAnalyticsPage() {
  const byMethod = useRevenueByMethod()

  const methodData = byMethod.data?.map((m) => ({
    label: m.method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: m.value,
  })) ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader title="Customer Analytics" description="Customer acquisition, behavior, and segmentation" />

      <Alert>
        <Info className="size-4" />
        <AlertTitle>Limited Data Availability</AlertTitle>
        <AlertDescription>
          Customer Analytics requires a Buyer App admin endpoint (<code>GET /api/v1/admin/buyers</code>) which is not yet available.
          Only Payment Method Usage data (from Payments App) is shown below.
          All customer KPI cards, acquisition charts, and segmentation data require the Buyer App endpoint.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Buyers" value="—" />
        <KpiCard label="New Buyers" value="—" />
        <KpiCard label="Repeat Rate" value="—" />
        <KpiCard label="At-Risk Buyers" value="—" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Buyer Acquisition (Last 12 Months)" isLoading={false}>
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Data not available — requires Buyer App admin endpoint
          </div>
        </ChartContainer>

        <ChartContainer title="Customer Segments" isLoading={false}>
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Data not available — requires Buyer App admin endpoint
          </div>
        </ChartContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="At-Risk Buyers" isLoading={false}>
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Data not available — requires Buyer App admin endpoint
          </div>
        </ChartContainer>

        <ChartContainer title="Payment Method Usage" isLoading={byMethod.isLoading} error={byMethod.error?.message} isEmpty={methodData.length === 0}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={methodData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="label" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {methodData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => [formatARS(Number(value ?? 0)), "Volume"]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
