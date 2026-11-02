"use client";
import { useMemo, useState } from "react";
import type { Tip } from "./shared";
import { money } from "./shared";

const DAY = 864e5;
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const niceMax = (v: number) => {
  if (v <= 0) return 10;
  const p = 10 ** Math.floor(Math.log10(v)), n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

/** Earnings per day + where tips come from. Single series, single colour: the title names it, so no legend. */
export function HomeCharts({ tips }: { tips: Tip[] }) {
  const [days, setDays] = useState<14 | 30>(30);
  const [table, setTable] = useState(false);
  const [hot, setHot] = useState<number | null>(null);

  const series = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const out = Array.from({ length: days }, (_, i) => {
      const d = new Date(today.getTime() - (days - 1 - i) * DAY);
      return { d, key: dayKey(d), usdc: 0, n: 0 };
    });
    const idx = new Map(out.map((o, i) => [o.key, i]));
    for (const t of tips) {
      if (t.status !== "received" || t.usdc === null) continue;
      const i = idx.get(dayKey(new Date(t.createdAt)));
      if (i !== undefined) { out[i].usdc += t.usdc; out[i].n += 1; }
    }
    return out;
  }, [tips, days]);

  const coins = useMemo(() => {
    const m = new Map<string, { usdc: number; n: number }>();
    for (const t of tips) {
      if (t.status !== "received" || t.usdc === null) continue;
      const k = t.originSymbol, c = m.get(k) ?? { usdc: 0, n: 0 };
      c.usdc += t.usdc; c.n += 1; m.set(k, c);
    }
    const rows = [...m.entries()].sort((a, b) => b[1].usdc - a[1].usdc).map(([k, v]) => ({ k, ...v }));
    if (rows.length <= 5) return rows;
    const rest = rows.slice(4).reduce((s, r) => ({ usdc: s.usdc + r.usdc, n: s.n + r.n }), { usdc: 0, n: 0 });
    return [...rows.slice(0, 4), { k: "Other", ...rest }];
  }, [tips]);

  const total = series.reduce((s, x) => s + x.usdc, 0), count = series.reduce((s, x) => s + x.n, 0);
  const max = niceMax(Math.max(...series.map((x) => x.usdc)));
  const coinMax = Math.max(...coins.map((c) => c.usdc), 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const readout = hot !== null
    ? <><b>{fmt(series[hot].d)}</b> · {series[hot].n ? `${money(series[hot].usdc)} USDC from ${series[hot].n} tip${series[hot].n === 1 ? "" : "s"}` : "No tips"}</>
    : <><b>Last {days} days</b> · {money(total)} USDC from {count} tip{count === 1 ? "" : "s"}</>;

  return (
    <div className="db-charts">
      <section className="tz-card db-chart" aria-labelledby="ch-earn">
        <div className="db-card-h">
          <h2 id="ch-earn">Received per day</h2>
          <span className="db-card-h__end">
            <span className="tz-chips" role="group" aria-label="Range">
              {([14, 30] as const).map((n) => <button key={n} type="button" className="tz-chip" aria-pressed={days === n} onClick={() => { setDays(n); setHot(null); }}>{n} days</button>)}
            </span>
          </span>
        </div>
        <p className="db-chart__read" aria-live="polite">{readout}</p>
        {table ? (
          <table className="tz-table db-table">
            <caption className="tz-sr-only">USDC received per day, days with tips only</caption>
            <thead><tr><th scope="col">Day</th><th scope="col" className="num">Tips</th><th scope="col" className="num">USDC</th></tr></thead>
            <tbody>{series.filter((x) => x.n).reverse().map((x) => <tr key={x.key}><td>{fmt(x.d)}</td><td className="num">{x.n}</td><td className="num"><b>{money(x.usdc)}</b></td></tr>)}</tbody>
          </table>
        ) : (
          <div className="db-bars" style={{ ["--cols" as string]: days }} onMouseLeave={() => setHot(null)}>
            {[1, 0.5, 0].map((f) => (
              <div key={f} className="db-bars__grid" style={{ bottom: `calc(var(--lab) + ${f * 180}px)` }}><span>{f ? money(max * f).replace(/\.00$/, "") : "0"}</span></div>
            ))}
            <div className="db-bars__plot" role="group" aria-label={`USDC received per day, last ${days} days`}>
              {series.map((x, i) => (
                <button key={x.key} type="button" className="db-bar" data-on={hot === i ? "" : undefined} data-zero={x.n ? undefined : ""}
                  aria-label={`${fmt(x.d)}: ${x.n ? `${money(x.usdc)} USDC, ${x.n} tips` : "no tips"}`}
                  onMouseEnter={() => setHot(i)} onFocus={() => setHot(i)} onBlur={() => setHot(null)}>
                  <i style={{ height: `${(x.usdc / max) * 100}%` }} />
                </button>
              ))}
            </div>
            <div className="db-bars__x" aria-hidden="true">
              {series.map((x, i) => <span key={x.key}>{(days - 1 - i) % (days === 30 ? 7 : 4) === 0 ? x.d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>)}
            </div>
          </div>
        )}
        <button type="button" className="db-link db-chart__toggle" onClick={() => setTable(!table)} aria-pressed={table}>{table ? "Show as chart" : "Show as table"}</button>
      </section>

      <section className="tz-card db-chart" aria-labelledby="ch-coin">
        <div className="db-card-h"><h2 id="ch-coin">What fans paid with</h2></div>
        <ul className="db-hbars">
          {coins.map((c) => (
            <li key={c.k}>
              <span className="db-hbars__k">{c.k}</span>
              <span className="db-hbars__track" aria-hidden="true"><i style={{ width: `${Math.max(3, (c.usdc / coinMax) * 100)}%` }} /></span>
              <span className="db-hbars__v"><b>{money(c.usdc)}</b><small>{c.n} tip{c.n === 1 ? "" : "s"}</small></span>
            </li>
          ))}
        </ul>
        <p className="db-quiet">USDC you received, grouped by the coin your fans sent. You always get USDC.</p>
      </section>
    </div>
  );
}
