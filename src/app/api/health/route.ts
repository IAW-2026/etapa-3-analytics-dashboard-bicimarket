import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "bicimarket-admin-dashboard",
    timestamp: new Date().toISOString(),
  });
}
