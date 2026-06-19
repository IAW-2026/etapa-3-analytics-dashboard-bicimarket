import { mockData } from "./mock-data"
import type { PaginatedResponse, Product, FilterState } from "./types"

export async function getProducts(
  filters?: { page?: number; limit?: number },
): Promise<PaginatedResponse<Product>> {
  const data = mockData.products.filter((p) => p.status === "active")
  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 50
  const start = (page - 1) * limit
  return {
    data: data.slice(start, start + limit),
    pagination: { page, limit, total: data.length, total_pages: Math.ceil(data.length / limit), has_more: start + limit < data.length },
  }
}

export async function getProductsAll(): Promise<Product[]> {
  return mockData.products.filter((p) => p.status === "active")
}

export async function getProductMetrics() {
  const active = mockData.products.filter((p) => p.status === "active")
  const categories = new Set(active.map((p) => p.category))
  const avgPrice = active.length > 0 ? Math.round(active.reduce((s, p) => s + p.price_cents, 0) / active.length) : 0
  const byCategory = new Map<string, number>()
  const byCondition = new Map<string, number>()

  for (const p of active) {
    byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1)
    byCondition.set(p.condition, (byCondition.get(p.condition) ?? 0) + 1)
  }

  return {
    total: active.length,
    categories_count: categories.size,
    avg_price_cents: avgPrice,
    by_category: Array.from(byCategory.entries()).map(([category, count]) => ({ category, count })),
    by_condition: Array.from(byCondition.entries()).map(([condition, count]) => ({ condition, count })),
  }
}
