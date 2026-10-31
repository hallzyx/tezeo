"use client";
import { useEffect } from "react";

/**
 * Behaviour for the static landing markup (ported from the prototype's inline scripts):
 * theme toggle, closing the mobile menu, scroll-triggered reveals, and the decorative mock QR.
 */
export function LandingEffects() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("tzl-js");
    // The landing styles key off an explicit data-theme, so settle on one (saved choice, else the OS).
    if (!root.dataset.theme) root.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    const btn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
    const sync = () => {
      if (!btn) return;
      const dark = root.dataset.theme === "dark";
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Light theme" : "Dark theme");
    };
    const flip = () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("tz-theme", next); } catch { /* private mode */ }
      sync();
    };
    sync();
    btn?.addEventListener("click", flip);

    const closers = [...document.querySelectorAll<HTMLAnchorElement>(".tzl-menu__panel a")].map((a) => {
      const f = () => { const d = a.closest("details"); if (d) d.open = false; };
      a.addEventListener("click", f);
      return [a, f] as const;
    });

    // Reveal: .is-in once a [data-reveal] block is on screen (the knot replays then).
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    const go = (el: HTMLElement) => {
      el.classList.add("is-in");
      const k = el.querySelector<HTMLElement>(".tz-knot");
      if (k) { k.classList.remove("is-playing"); void k.offsetWidth; k.classList.add("is-playing"); }
    };
    let io: IntersectionObserver | null = null;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) els.forEach(go);
    else {
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { go(e.target as HTMLElement); io!.unobserve(e.target); } }), { threshold: 0.35 });
      els.forEach((el) => io!.observe(el));
    }

    // Decorative mock QR (deterministic, NOT scannable)
    document.querySelectorAll<HTMLCanvasElement>("canvas.tzl-qrsvg").forEach((c) => {
      const x = c.getContext("2d"); if (!x) return;
      const n = 21, s = c.width / n; let seed = 7;
      const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = "#1C1424";
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (r() > 0.52) x.fillRect(i * s, j * s, Math.ceil(s), Math.ceil(s));
      const eye = (a: number, b: number) => { x.fillStyle = "#1C1424"; x.fillRect(a * s, b * s, 7 * s, 7 * s); x.fillStyle = "#fff"; x.fillRect((a + 1) * s, (b + 1) * s, 5 * s, 5 * s); x.fillStyle = "#D1245A"; x.fillRect((a + 2) * s, (b + 2) * s, 3 * s, 3 * s); };
      eye(0, 0); eye(n - 7, 0); eye(0, n - 7);
    });

    return () => {
      root.classList.remove("tzl-js");
      btn?.removeEventListener("click", flip);
      closers.forEach(([a, f]) => a.removeEventListener("click", f));
      io?.disconnect();
    };
  }, []);
  return null;
}
