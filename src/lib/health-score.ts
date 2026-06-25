export type HealthStatus = "urgent" | "alert" | "attention" | "stable" | "healthy" | "excellent"

export interface WeightedHealthMetric {
  value: number | null | undefined
  weight: number
  critical?: boolean
}

export interface HealthResult {
  score: number
  status: HealthStatus
}

export function clampScore(value: number) {
  return Math.min(100, Math.max(0, value))
}

export function classifyHealth(score: number): HealthStatus {
  if (score < 15) return "urgent"
  if (score < 25) return "alert"
  if (score < 45) return "attention"
  if (score <= 65) return "stable"
  if (score <= 75) return "healthy"
  return "excellent"
}

export function calculateHealth(metrics: WeightedHealthMetric[]): HealthResult | null {
  const available = metrics.filter(
    (metric): metric is WeightedHealthMetric & { value: number } =>
      typeof metric.value === "number" && Number.isFinite(metric.value) && metric.weight > 0,
  )

  if (available.length === 0) return null

  const totalWeight = available.reduce((sum, metric) => sum + metric.weight, 0)
  const score = clampScore(
    available.reduce((sum, metric) => sum + clampScore(metric.value) * metric.weight, 0) / totalWeight,
  )
  const urgentOverride = available.some((metric) => metric.critical && metric.value < 15)

  return {
    score,
    status: urgentOverride ? "urgent" : classifyHealth(score),
  }
}

export function percentage(part: number | null | undefined, total: number | null | undefined) {
  if (typeof part !== "number" || typeof total !== "number" || total <= 0) return null
  return clampScore((part / total) * 100)
}

export function inversePercentage(part: number | null | undefined, total: number | null | undefined) {
  const ratio = percentage(part, total)
  return ratio == null ? null : 100 - ratio
}

export function trendHealth(previous: number | null | undefined, current: number | null | undefined) {
  if (typeof previous !== "number" || typeof current !== "number" || previous <= 0) return null
  const change = ((current - previous) / Math.abs(previous)) * 100
  return clampScore(50 + change)
}
