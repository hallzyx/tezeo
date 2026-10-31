import { NextResponse } from "next/server";
import { ping } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Container health check: 200 only when the app can reach Postgres. Never touches Aurora. */
export async function GET() {
  try {
    await ping();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
