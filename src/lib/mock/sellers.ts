import { mockData } from "./mock-data"
import type { SellerProfile } from "./types"

export async function getSellersAll(): Promise<SellerProfile[]> {
  return [...mockData.sellers]
}

export async function getSellerMetrics() {
  const sellers = mockData.sellers
  const verified = sellers.filter((s) => s.verification_status === "verified")
  const pending = sellers.filter((s) => s.verification_status === "pending_review" || s.verification_status === "in_review")
  const suspended = sellers.filter((s) => s.verification_status === "suspended")

  return {
    total: sellers.length,
    verified_count: verified.length,
    pending_count: pending.length,
    suspended_count: suspended.length,
    product_count_total: sellers.reduce((sum, s) => sum + s.product_count, 0),
  }
}
