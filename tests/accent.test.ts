import { describe, expect, it } from "vitest";
import { ACCENT_PRESETS, contrast, parseHex, validateAccent } from "@/lib/accent";

describe("creator accent guard (DESIGN.md §3.4)", () => {
  it("accepts every preset and guarantees contrast for both themes", () => {
    for (const hex of ACCENT_PRESETS) {
      const r = validateAccent(hex);
      expect(r.ok, hex).toBe(true);
      if (r.ok) {
        expect(contrast([255, 255, 255], parseHex(r.light)!)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(parseHex("#120D18")!, parseHex(r.dark)!)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it("darkens neon yellow for light mode instead of rejecting it", () => {
    const r = validateAccent("#E8FF3A");
    expect(r.ok && r.light !== "#E8FF3A").toBe(true);
  });
  it("rejects colours that look like the failed or received status colours", () => {
    for (const hex of ["#D9481F", "#12A065", "#D94820"]) {
      const r = validateAccent(hex);
      expect(r.ok, hex).toBe(false);
      if (!r.ok) expect(r.suggestion).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
  it("rejects malformed values", () => {
    expect(validateAccent("teal").ok).toBe(false);
    expect(validateAccent("#fff").ok).toBe(false);
  });
});
