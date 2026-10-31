import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidSolanaAddress, normalizeHandle } from "@/lib/domain";
import { createCreator, getCreatorByHandle } from "@/lib/tips";

const Body = z.object({
  handle: z.string(),
  displayName: z.string().trim().min(1).max(60),
  message: z.string().trim().max(280).optional(),
  avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  wallet: z.string(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the form fields and try again." }, { status: 400 });
  const b = parsed.data;
  const handle = normalizeHandle(b.handle);
  if (!handle) return NextResponse.json({ error: "Handle must be 3-24 characters: letters, numbers or underscore." }, { status: 400 });
  // RF-2: validate the wallet before saving.
  if (!isValidSolanaAddress(b.wallet.trim()))
    return NextResponse.json({ error: "That doesn't look like a valid Solana address." }, { status: 400 });
  if (getCreatorByHandle(handle)) return NextResponse.json({ error: "That handle is taken." }, { status: 409 });

  const c = createCreator({ ...b, handle, wallet: b.wallet.trim() });
  return NextResponse.json({ handle: c.handle, dashboardToken: c.dashboard_token }, { status: 201 });
}
