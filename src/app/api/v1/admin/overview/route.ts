import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { getMarketplaceOverview } from "@/lib/marketplace-overview";

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin requerido" } },
      { status: 403 },
    );
  }

  return NextResponse.json(await getMarketplaceOverview());
}
