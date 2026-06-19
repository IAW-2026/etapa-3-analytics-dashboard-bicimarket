export const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  paid: "Pagado",
  completed: "Completado",
  delivered: "Entregado",
  verified: "Verificado",
  active: "Activo",
  in_transit: "En tránsito",
  manual_review: "Revisión manual",
  in_review: "En revisión",
  failed: "Fallido",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  suspended: "Suspendido",
  pending_review: "Pendiente de revisión",
  refunded: "Reembolsado",
  Verified: "Verificado",
  Pending: "Pendiente",
  Suspended: "Suspendido",
}

export function translateStatus(status: string | null | undefined): string {
  if (!status) return "—"
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ")
}

export const METHOD_LABELS: Record<string, string> = {
  credit_card: "Tarjeta de Crédito",
  debit_card: "Tarjeta de Débito",
  mercadopago: "Mercado Pago",
  transfer: "Transferencia",
  wallet: "Billetera",
}

export function translateMethod(method: string | null | undefined): string {
  if (!method) return "—"
  return METHOD_LABELS[method] ?? method.replace(/_/g, " ")
}

export const CONDITION_LABELS: Record<string, string> = {
  new: "Nuevo",
  used: "Usado",
  refurbished: "Reacondicionado",
}

export function translateCondition(condition: string | null | undefined): string {
  if (!condition) return "—"
  return CONDITION_LABELS[condition] ?? condition
}

export const DAY_LABELS: Record<string, string> = {
  Mon: "Lun",
  Tue: "Mar",
  Wed: "Mié",
  Thu: "Jue",
  Fri: "Vie",
  Sat: "Sáb",
  Sun: "Dom",
}
