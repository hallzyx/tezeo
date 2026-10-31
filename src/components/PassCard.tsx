/** The woven membership ticket (DESIGN.md §7.H). States: active, expiring (≤3 days), expired. */
export const PASS_DAYS = 30;

export function passState(expiresAt: string, now = Date.now()) {
  const left = new Date(expiresAt).getTime() - now;
  const days = Math.max(0, Math.ceil(left / 86_400_000));
  return { days, state: left <= 0 ? "expired" : days <= 3 ? "expiring" : "active" } as const;
}

export function PassCard({ creatorName, holder, expiresAt, preview }: { creatorName: string; holder: string; expiresAt?: string; preview?: boolean }) {
  const s = expiresAt ? passState(expiresAt) : { days: PASS_DAYS, state: "active" as const };
  const until = expiresAt ? new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  return (
    <div className="tz-pass" data-state={s.state === "expired" ? "expired" : undefined} style={{ ["--_p" as string]: `${(s.days / PASS_DAYS) * 100}%` }} data-testid="pass-card" suppressHydrationWarning>
      <div>
        <span className="tz-overline">Membership pass</span>
        <p className="tz-pass__title">{creatorName}'s Crew</p>
        <span className="tz-pass__meta">
          {preview ? "30 days from the day you join" : `${holder || "Member"} · ${s.state === "expired" ? "ended" : "active until"} ${until}`}
        </span>
      </div>
      <div className="tz-pass__days">{s.days}<small>days</small></div>
      <div className="tz-pass__meter" aria-hidden="true"><span /></div>
    </div>
  );
}
