/**
 * Creator accent guard (DESIGN.md §3.4). Pure functions, safe on server and client.
 * The CSS already clamps the accent in OKLCH at render time; this guard exists for browsers
 * without relative colour and to keep accents from being mistaken for status colours.
 */
type RGB = [number, number, number];

export const DEFAULT_ACCENT = "#1A9E8F";
const NIGHT = "#120D18";
const ARCILLA = "#D9481F"; // failed
const HIERBA = "#12A065"; // received
// DESIGN.md §3.4 says 0.08, but the designer's own default accent (Turquesa #1A9E8F) measures 0.064 from Hierba,
// so 0.08 would reject the default. 0.05 keeps near-identical colours out and lets Turquesa through.
const MIN_DELTA_E = 0.05;

export function parseHex(hex: string): RGB | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const toHex = ([r, g, b]: RGB) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();

const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const unlin = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function luminance([r, g, b]: RGB): number {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
export function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function toOklab([r, g, b]: RGB): [number, number, number] {
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
export function fromOklab([L, a, b]: [number, number, number]): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    unlin(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    unlin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    unlin(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
export function deltaE(a: RGB, b: RGB): number {
  const [x, y] = [toOklab(a), toOklab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** Step OKLab lightness (chroma and hue preserved) until `ok(rgb)` or the bound is hit. */
function shiftLightness(rgb: RGB, dir: 1 | -1, ok: (c: RGB) => boolean): RGB {
  const [L, a, b] = toOklab(rgb);
  let cur = rgb;
  for (let l = L; l >= 0 && l <= 1; l += dir * 0.02) {
    // Check the colour as it will be stored (8-bit, in gamut), not the float intermediate.
    cur = fromOklab([l, a, b]).map((v) => Math.max(0, Math.min(255, Math.round(v)))) as RGB;
    if (ok(cur)) return cur;
  }
  return cur;
}

export type AccentResult =
  | { ok: true; accent: string; light: string; dark: string }
  | { ok: false; reason: string; suggestion?: string };

export function validateAccent(hex: string): AccentResult {
  const rgb = parseHex(hex);
  if (!rgb) return { ok: false, reason: "Pick a colour like #1A9E8F." };
  // 4. Not confusable with the "failed" or "received" status colours.
  for (const status of [ARCILLA, HIERBA]) {
    const s = parseHex(status)!;
    if (deltaE(rgb, s) < MIN_DELTA_E) {
      const [L, a, b] = toOklab(rgb);
      const hue = Math.atan2(b, a) + (status === ARCILLA ? 0.9 : -0.9);
      const c = Math.hypot(a, b);
      return {
        ok: false,
        reason: "That colour is too close to a payment-status colour, so it could be mistaken for one. Try another.",
        suggestion: toHex(fromOklab([L, c * Math.cos(hue), c * Math.sin(hue)])),
      };
    }
  }
  // 1-3. Darken until white-on-fill >= 4.5 (light); lighten until fill-on-night >= 4.5 (dark).
  const white: RGB = [255, 255, 255];
  const night = parseHex(NIGHT)!;
  const light = contrast(white, rgb) >= 4.5 ? rgb : shiftLightness(rgb, -1, (c) => contrast(white, c) >= 4.5);
  const dark = contrast(night, rgb) >= 4.5 ? rgb : shiftLightness(rgb, 1, (c) => contrast(night, c) >= 4.5);
  return { ok: true, accent: toHex(rgb), light: toHex(light), dark: toHex(dark) };
}

export const ACCENT_PRESETS = ["#1A9E8F", "#7C3AED", "#0EA5E9", "#F97316", "#E8FF3A", "#FF66CC", "#111111"];
