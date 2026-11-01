import { NextResponse } from "next/server";
import { z } from "zod";
import { validateAccent } from "@/lib/accent";
import { normalizeHandle, walletProblem } from "@/lib/domain";
import { createCreator, getCreatorByHandle } from "@/lib/tips";
import { walletHasUsdcAccount } from "@/lib/solana";

const Body = z.object({
  handle: z.string(),
  displayName: z.string().trim().min(1).max(60),
  message: z.string().trim().max(160).optional(),
  // https URL, or a small client-resized JPEG/PNG data URL (no file storage needed).
  avatarUrl: z.string().max(60_000).regex(/^(https:\/\/\S+|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+)$/).optional().or(z.literal("")),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  wallet: z.string(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the form fields and try again.", code: "invalid" }, { status: 400 });
  const b = parsed.data;
  const handle = normalizeHandle(b.handle);
  if (!handle) return NextResponse.json({ error: "3 to 24 letters, numbers or _.", field: "handle", code: "format" }, { status: 400 });
  // RF-2: validate the wallet before saving.
  const problem = walletProblem(b.wallet);
  if (problem) return NextResponse.json({ error: "That doesn't look like a valid Solana address.", field: "wallet", code: problem }, { status: 400 });
  if (await getCreatorByHandle(handle)) return NextResponse.json({ error: "That handle is taken.", field: "handle", code: "taken" }, { status: 409 });

  // DESIGN.md §3.4: keep accents legible and distinct from status colours.
  let accent = b.accent ?? "";
  if (accent) {
    const a = validateAccent(accent);
    if (!a.ok) return NextResponse.json({ error: a.reason, field: "accent", code: a.near ?? "invalid", suggestion: a.suggestion }, { status: 422 });
    accent = a.accent;
  }

  let c;
  try {
    c = await createCreator({ ...b, accent, handle, wallet: b.wallet.trim() });
  } catch (e) {
    // Two people claiming the same handle at once: the UNIQUE constraint decides (Postgres 23505).
    if ((e as { code?: string }).code === "23505") return NextResponse.json({ error: "That handle is taken.", field: "handle", code: "taken" }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ handle: c.handle, dashboardToken: c.dashboard_token, walletHasUsdc: await walletHasUsdcAccount(c.wallet) }, { status: 201 });
}
