import { NextResponse } from "next/server";
import { cleanHandle, normalizeHandle } from "@/lib/domain";
import { getCreatorByHandle } from "@/lib/tips";

/** Live "is this link free?" check for onboarding. Never logs the input. */
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < 60_000)) hits.delete(k);
  return recent.length > 30;
}

export async function GET(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ error: "Too many checks. Try again in a minute." }, { status: 429 });
  const raw = new URL(req.url).searchParams.get("h") ?? "";
  const handle = normalizeHandle(cleanHandle(raw));
  if (!handle) return NextResponse.json({ handle: cleanHandle(raw), valid: false, available: false, suggestions: [] });
  if (!(await getCreatorByHandle(handle))) return NextResponse.json({ handle, valid: true, available: true, suggestions: [] });
  const ideas = [`${handle.slice(0, 20)}_${["live", "art", "hq"][handle.length % 3]}`, `${handle.slice(0, 22)}${(handle.length % 8) + 2}`, `the_${handle.slice(0, 20)}`]
    .map((h) => normalizeHandle(h)).filter((h): h is string => !!h);
  const free: string[] = [];
  for (const h of ideas) if (!(await getCreatorByHandle(h))) free.push(h);
  return NextResponse.json({ handle, valid: true, available: false, suggestions: free.slice(0, 3) });
}
