import type {
  Payment,
  Settlement,
  Refund,
  Payout,
  Product,
  SalesOrder,
  Shipment,
  SellerProfile,
  BuyerProfile,
  SellerGroup,
} from "./types"

const SELLERS = [
  { id: "slp_bicisur", name: "BiciSur", verified: true },
  { id: "slp_bikear", name: "BikeAR", verified: true },
  { id: "slp_rodadosxx", name: "RodadosXX", verified: true },
  { id: "slp_ciclosok", name: "Ciclos OK", verified: true },
  { id: "slp_mtbhouse", name: "MTB House", verified: true },
  { id: "slp_urbanride", name: "Urban Ride", verified: false },
  { id: "slp_bicishop", name: "BiciShop", verified: true },
  { id: "slp_labici", name: "La Bici", verified: false },
]

const PRODUCTS_BY_SELLER: Record<string, { title: string; category: string; condition: string; price_cents: number }[]> = {
  slp_bicisur: [
    { title: "Trek Procaliber 8", category: "mtb", condition: "new", price_cents: 390000000 },
    { title: "Shimano XT Set", category: "parts", condition: "new", price_cents: 180000000 },
    { title: "Casco MTB Fox", category: "accessories", condition: "new", price_cents: 45000000 },
    { title: "Bicicleta MTB Trek Procaliber 8 2026", category: "mtb", condition: "new", price_cents: 390000000 },
    { title: "Cubierta Schwalbe 29", category: "parts", condition: "new", price_cents: 35000000 },
  ],
  slp_bikear: [
    { title: "Specialized Rockhopper", category: "mtb", condition: "new", price_cents: 250000000 },
    { title: "Shimano Pedales SPD", category: "parts", condition: "used_like_new", price_cents: 25000000 },
    { title: "Guantes Fox", category: "indumentaria", condition: "new", price_cents: 15000000 },
    { title: "Sillín Prologo", category: "parts", condition: "new", price_cents: 35000000 },
    { title: "Bicicleta Specialized Rockhopper 2026", category: "mtb", condition: "new", price_cents: 250000000 },
  ],
  slp_rodadosxx: [
    { title: "Canyon Spectral", category: "mtb", condition: "used_good", price_cents: 180000000 },
    { title: "Frenos Shimano Deore", category: "parts", condition: "new", price_cents: 55000000 },
    { title: "Rodado 29 Rueda Completa", category: "parts", condition: "new", price_cents: 85000000 },
    { title: "Bicicleta Canyon Spectral 2025", category: "mtb", condition: "used_good", price_cents: 180000000 },
  ],
  slp_ciclosok: [
    { title: "Giant Escape City", category: "urban", condition: "new", price_cents: 150000000 },
    { title: "Luces Delantera NiteRider", category: "accessories", condition: "new", price_cents: 12000000 },
    { title: "Bicicleta Giant Escape City 2026", category: "urban", condition: "new", price_cents: 150000000 },
    { title: "Portaequipajes", category: "accessories", condition: "new", price_cents: 18000000 },
  ],
  slp_mtbhouse: [
    { title: "Scott Aspect 960", category: "mtb", condition: "used_fair", price_cents: 90000000 },
    { title: "Bicicleta MTB Scott Aspect 960", category: "mtb", condition: "used_fair", price_cents: 90000000 },
    { title: "Casco Enduro Bell", category: "accessories", condition: "new", price_cents: 65000000 },
    { title: "Multiherramienta Crank Brothers", category: "parts", condition: "new", price_cents: 18000000 },
  ],
  slp_urbanride: [
    { title: "Bicicleta Urbana Oxford", category: "urban", condition: "new", price_cents: 120000000 },
    { title: "Candado Abus", category: "accessories", condition: "new", price_cents: 25000000 },
  ],
  slp_bicishop: [
    { title: "Bicicleta BMX Sunday", category: "bmx", condition: "new", price_cents: 200000000 },
    { title: "Casco BMX Pro", category: "accessories", condition: "new", price_cents: 35000000 },
  ],
  slp_labici: [
    { title: "Sillín Infantil", category: "kids", condition: "used_good", price_cents: 15000000 },
    { title: "Bicicleta Infantil 20", category: "kids", condition: "new", price_cents: 80000000 },
  ],
}

const CATEGORIES = ["mtb", "road", "urban", "kids", "bmx", "parts", "accessories", "indumentaria"] as const
const CONDITIONS = ["new", "used_like_new", "used_good", "used_fair"] as const
const PAYMENT_METHODS = ["credit_card", "debit_card", "mercadopago", "transfer", "wallet"] as const
const SHIPMENT_STATUSES = ["delivered", "in_transit", "ready_for_pickup", "picked_up", "out_for_delivery", "failed_delivery"] as const
const CARRIERS = ["OCA", "Andreani", "Correo Argentino", "PedidosYa"] as const

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: readonly T[]): T {
  return arr[rand(0, arr.length - 1)]
}

function formatDate(d: Date): string {
  return d.toISOString()
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function generateMockData() {
  const now = new Date()
  const startDate = addDays(now, -180)

  const allProducts: Product[] = []
  const allPayments: Payment[] = []
  const allSettlements: Settlement[] = []
  const allRefunds: Refund[] = []
  const allPayouts: Payout[] = []
  const allSalesOrders: SalesOrder[] = []
  const allShipments: Shipment[] = []
  const allBuyers: BuyerProfile[] = []

  let productIndex = 0
  let paymentIndex = 0

  const buyerNames = [
    "Juan Pérez", "María García", "Carlos López", "Ana Martínez",
    "Pedro Rodríguez", "Laura Fernández", "Diego González", "Sofía Díaz",
    "José Ruiz", "Valentina Álvarez",
  ]

  for (let i = 0; i < 50; i++) {
    const buyerId = `byr_${String(i + 1).padStart(3, "0")}`
    const buyerName = i < 10 ? buyerNames[i] : `Comprador ${i + 1}`
    const firstPurchase = addDays(startDate, rand(0, 120))
    const orderCount = rand(1, 6)
    allBuyers.push({
      id: buyerId,
      display_name: buyerName,
      email: `buyer${i + 1}@email.com`,
      created_at: formatDate(addDays(startDate, rand(-60, -1))),
      order_count: orderCount,
      total_spent_cents: 0,
      last_purchase_at: null,
    })
  }

  for (const seller of SELLERS) {
    const products = PRODUCTS_BY_SELLER[seller.id] ?? []
    for (const prod of products) {
      productIndex++
      allProducts.push({
        id: `prd_${String(productIndex).padStart(4, "0")}`,
        seller_profile_id: seller.id,
        seller_name: seller.name,
        title: prod.title,
        category: prod.category as any,
        condition: prod.condition as any,
        price_cents: prod.price_cents,
        status: "active",
        created_at: formatDate(addDays(startDate, rand(-180, -1))),
      })
    }
  }

  const activeProducts = allProducts.filter((p) => p.status === "active")

  for (let day = 0; day < 180; day++) {
    const date = addDays(startDate, day)
    const ordersToday = rand(3, 12)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const actualOrders = isWeekend ? Math.round(ordersToday * 0.6) : ordersToday

    for (let o = 0; o < actualOrders; o++) {
      paymentIndex++
      const sellerCount = rand(1, 3)
      const usedSellers = new Set<string>()
      const sellerGroups: SellerGroup[] = []
      let totalAmount = 0

      for (let s = 0; s < sellerCount; s++) {
        const seller = SELLERS[rand(0, SELLERS.length - 1)]
        if (usedSellers.has(seller.id)) continue
        usedSellers.add(seller.id)

        const itemsCount = rand(1, 3)
        const sellerProducts = activeProducts.filter((p) => p.seller_profile_id === seller.id)
        const items = []
        let subtotal = 0

        for (let i = 0; i < itemsCount && sellerProducts.length > 0; i++) {
          const prod = sellerProducts[rand(0, sellerProducts.length - 1)]
          const qty = rand(1, 2)
          const lineTotal = prod.price_cents * qty
          subtotal += lineTotal
          items.push({
            product_id: prod.id,
            product_name_snapshot: prod.title,
            unit_price_cents: prod.price_cents,
            quantity: qty,
          })
        }

        const shipping = rand(800000, 2500000)
        totalAmount += subtotal + shipping

        sellerGroups.push({
          seller_profile_id: seller.id,
          order_seller_group_id: `osg_${paymentIndex}_${s}`,
          items,
          subtotal_cents: subtotal,
          shipping_cost_cents: shipping,
        })
      }

      if (sellerGroups.length === 0) continue

      const paymentDate = new Date(date)
      paymentDate.setHours(rand(8, 22), rand(0, 59))

      const isApproved = Math.random() < 0.94
      const isRefunded = isApproved && Math.random() < 0.03
      const paymentStatus = isRefunded ? "refunded" : isApproved ? "approved" : Math.random() < 0.5 ? "rejected" : "cancelled"

      const paymentId = `pay_${String(paymentIndex).padStart(5, "0")}`
      const orderId = `ord_${String(paymentIndex).padStart(5, "0")}`
      const buyer = allBuyers[rand(0, allBuyers.length - 1)]

      const payment: Payment = {
        id: paymentId,
        order_id: orderId,
        amount_cents: totalAmount,
        status: paymentStatus,
        method: pick(PAYMENT_METHODS),
        buyer_profile_id: buyer.id,
        items_summary: sellerGroups,
        created_at: formatDate(paymentDate),
        approved_at: isApproved ? formatDate(addDays(paymentDate, 0)) : null,
      }
      allPayments.push(payment)

      if (isApproved) {
        const settlementDate = addDays(paymentDate, rand(1, 3))

        for (const group of sellerGroups) {
          const sellerInfo = SELLERS.find((s) => s.id === group.seller_profile_id)!
          const gross = group.subtotal_cents + group.shipping_cost_cents
          const fee = Math.round(gross * 0.1)
          const net = gross - fee

          const settlementStatus = Math.random() < 0.75 ? "paid" : Math.random() < 0.8 ? "failed" : Math.random() < 0.9 ? "manual_review" : "pending"

          const settlementId = `set_${allSettlements.length + 1}`
          allSettlements.push({
            id: settlementId,
            payment_id: paymentId,
            seller_profile_id: group.seller_profile_id,
            seller_name: sellerInfo.name,
            gross_amount_cents: gross,
            fee_amount_cents: fee,
            net_amount_cents: net,
            status: settlementStatus,
            created_at: formatDate(settlementDate),
            paid_at: settlementStatus === "paid" ? formatDate(addDays(settlementDate, rand(2, 7))) : null,
          })

          const salesOrderStatusMap: Record<string, SalesOrder["fulfillment_status"]> = {
            paid: "delivered",
            pending: "pending",
            failed: "cancelled",
            manual_review: "preparing",
          }

          allSalesOrders.push({
            id: `sor_${allSalesOrders.length + 1}`,
            order_id: orderId,
            seller_profile_id: group.seller_profile_id,
            seller_name: sellerInfo.name,
            fulfillment_status: salesOrderStatusMap[settlementStatus] ?? "pending",
            payment_status: "paid",
            total_cents: gross,
            created_at: formatDate(settlementDate),
          })

          const shipmentDate = addDays(settlementDate, rand(1, 2))
          const deliveryDays = rand(2, 6)
          const shipmentStatus = settlementStatus === "paid"
            ? ("delivered" as const)
            : (pick(["in_transit", "ready_for_pickup", "picked_up"]) as any)

          allShipments.push({
            id: `shp_${allShipments.length + 1}`,
            order_id: orderId,
            seller_profile_id: group.seller_profile_id,
            status: shipmentStatus,
            cost_cents: group.shipping_cost_cents,
            carrier: pick(CARRIERS),
            created_at: formatDate(shipmentDate),
            delivered_at: shipmentStatus === "delivered" ? formatDate(addDays(shipmentDate, deliveryDays)) : null,
            estimated_days_min: 2,
            estimated_days_max: 7,
          })
        }

        if (Math.random() < 0.02) {
          const refundAmount = Math.round(totalAmount * (Math.random() < 0.5 ? 1 : 0.5))
          allRefunds.push({
            id: `ref_${allRefunds.length + 1}`,
            payment_id: paymentId,
            amount_cents: refundAmount,
            status: "approved",
            reason: pick(["seller_rejected", "buyer_cancelled", "not_delivered", "manual"]),
            created_at: formatDate(addDays(paymentDate, rand(5, 15))),
          })
        }
      }

      const buyerPurchases = allPayments.filter((p) => p.buyer_profile_id === buyer.id)
      buyer.total_spent_cents = buyerPurchases.reduce((sum, p) => sum + p.amount_cents, 0)
      buyer.order_count = buyerPurchases.length
      const lastPayment = buyerPurchases[buyerPurchases.length - 1]
      buyer.last_purchase_at = lastPayment ? lastPayment.created_at : null
    }
  }

  for (const settlement of allSettlements) {
    if (settlement.status === "paid" && Math.random() < 0.85) {
      const payoutDate = addDays(new Date(settlement.paid_at ?? settlement.created_at), rand(1, 5))
      allPayouts.push({
        id: `pay_${allPayouts.length + 1}`,
        settlement_id: settlement.id,
        seller_profile_id: settlement.seller_profile_id,
        seller_name: settlement.seller_name,
        amount_cents: settlement.net_amount_cents,
        status: Math.random() < 0.05 ? "failed" : "completed",
        created_at: settlement.created_at,
        completed_at: formatDate(payoutDate),
        attempts: 1,
        last_error: null,
      })
    }
  }

  const sellerProfiles: SellerProfile[] = SELLERS.map((s) => {
    const sellerProducts = allProducts.filter((p) => p.seller_profile_id === s.id)
    return {
      id: s.id,
      display_name: s.name,
      verification_status: s.verified ? "verified" : "pending_review",
      created_at: formatDate(addDays(startDate, -rand(30, 180))),
      product_count: sellerProducts.length,
      avg_response_time_hours: rand(1, 8),
    }
  })

  return {
    payments: allPayments,
    settlements: allSettlements,
    refunds: allRefunds,
    payouts: allPayouts,
    products: allProducts,
    salesOrders: allSalesOrders,
    shipments: allShipments,
    sellers: sellerProfiles,
    buyers: allBuyers,
  }
}

export const mockData = generateMockData()
