/** Handle of the demo creator (env DEMO_STAGE_HANDLE). Forgiving: trims spaces, quotes and a leading "@". Empty = demo stage off. */
export function demoHandle(): string | null {
  const raw = process.env.DEMO_STAGE_HANDLE ?? "";
  const h = raw.trim().replace(/^["']+|["']+$/g, "").replace(/^@/, "").trim().toLowerCase();
  return h || null;
}
