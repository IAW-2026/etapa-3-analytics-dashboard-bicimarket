export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    [key: string]: unknown
  }
}

export interface Payment {
  id: string
  order_id: string
  amount_cents: number
  status: "pending" | "approved" | "rejected" | "cancelled" | "refunded"
  method: "credit_card" | "debit_card" | "mercadopago" | "transfer" | "wallet"
  buyer_profile_id: string
  items_summary: SellerGroup[]
  created_at: string
  approved_at: string | null
}

export interface SellerGroup {
  seller_profile_id: string
  order_seller_group_id: string
  items: OrderItem[]
  subtotal_cents: number
  shipping_cost_cents: number
}

export interface OrderItem {
  product_id: string
  product_name_snapshot: string
  unit_price_cents: number
  quantity: number
}

export interface Settlement {
  id: string
  payment_id: string
  seller_profile_id: string
  seller_name: string
  gross_amount_cents: number
  fee_amount_cents: number
  net_amount_cents: number
  status: "pending" | "paid" | "failed" | "manual_review"
  created_at: string
  paid_at: string | null
}

export interface Refund {
  id: string
  payment_id: string
  amount_cents: number
  status: "pending" | "approved" | "rejected"
  reason: "seller_rejected" | "buyer_cancelled" | "not_delivered" | "manual"
  created_at: string
}

export interface Payout {
  id: string
  settlement_id: string
  seller_profile_id: string
  seller_name: string
  amount_cents: number
  status: "pending" | "completed" | "failed"
  created_at: string
  completed_at: string | null
  attempts: number
  last_error: string | null
}

export interface Shipment {
  id: string
  order_id: string
  seller_profile_id: string
  status:
    | "created"
    | "ready_for_pickup"
    | "picked_up"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed_delivery"
    | "returned"
  cost_cents: number
  carrier: string
  created_at: string
  delivered_at: string | null
  estimated_days_min: number
  estimated_days_max: number
}

export type DatePreset = "7d" | "30d" | "90d" | "1y" | "custom"

export interface FilterState {
  preset: DatePreset
  from: Date
  to: Date
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface AttentionItem {
  id: string
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  link?: string
}

export interface Buyer {
  id: string
  full_name: string
  email: string
  phone: string | null
  created_at: string
  orders_count: number
}
