import { NextRequest, NextResponse } from "next/server"

const ALLOWED_PATHS = new Set([
  "sellers/metrics",
  "products/metrics",
  "sales-orders/metrics",
  "admin/seller-profiles",
])

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params
  const path = slug.join("/")

  if (!ALLOWED_PATHS.has(path)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN_PATH", message: `Path not allowed: ${path}` } },
      { status: 403 },
    )
  }

  const apiPath = `/api/v1/${path}`
  const searchParams = req.nextUrl.searchParams.toString()
  const fullPath = searchParams ? `${apiPath}?${searchParams}` : apiPath

  const baseUrl = process.env.SELLER_API_URL?.replace(/\/$/, "")
  const token = process.env.DASHBOARD_TO_SELLER_SERVICE_TOKEN

  if (!baseUrl) {
    return NextResponse.json(
      { error: { code: "UPSTREAM_ERROR", message: "SELLER_API_URL no está configurada" } },
      { status: 503 },
    )
  }
  if (!token) {
    return NextResponse.json(
      { error: { code: "UPSTREAM_ERROR", message: "DASHBOARD_TO_SELLER_SERVICE_TOKEN no está configurado" } },
      { status: 503 },
    )
  }

  const url = `${baseUrl}${fullPath}`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": token,
        "X-Request-Id": crypto.randomUUID(),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })

    const body = await response.json()

    if (!response.ok) {
      return NextResponse.json(body, { status: response.status })
    }

    return NextResponse.json(body, { status: response.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: { code: "PROXY_ERROR", message } },
      { status: 502 },
    )
  }
}
