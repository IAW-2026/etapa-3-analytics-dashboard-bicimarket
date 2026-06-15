import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import {
  getMarketplaceAppConfig,
  getServiceJson,
  MARKETPLACE_APPS,
  type MarketplaceApp,
} from "@/lib/service-auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ app: string }> },
) {
  if (!(await getAdminUser())) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin requerido" } },
      { status: 403 },
    );
  }

  const { app } = await context.params;
  if (!MARKETPLACE_APPS.includes(app as MarketplaceApp)) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Aplicación desconocida" } },
      { status: 404 },
    );
  }

  const target = app as MarketplaceApp;
  const config = getMarketplaceAppConfig(target);
  const queryPath = request.nextUrl.searchParams.get("path");
  const path = queryPath?.startsWith("/") ? queryPath : config.resourcePath;

  try {
    return NextResponse.json(await getServiceJson(target, path));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo consultar la app";
    return NextResponse.json(
      { error: { code: "UPSTREAM_ERROR", message } },
      { status: 502 },
    );
  }
}
