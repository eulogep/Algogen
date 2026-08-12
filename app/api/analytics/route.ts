import { NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    snapshot: getAnalyticsSnapshot(),
    scope: "instance-memory-last-24h",
  });
}
