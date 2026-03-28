import { describe, it, expect } from "vitest";
import { mulberry32 } from "../src/shared/prng.js";

describe("mulberry32", () => {
  it("returns values in [0, 1)", () => {
    const rng = mulberry32(0);
    for (let i = 0; i < 200; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic for same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      expect(a()).toBe(b());
    }
  });

  it("different seeds produce different sequences", () => {
    const a = mulberry32(0);
    const b = mulberry32(1);
    let differ = false;
    for (let i = 0; i < 20; i++) {
      if (a() !== b()) { differ = true; break; }
    }
    expect(differ).toBe(true);
  });

  it("produces reasonable distribution", () => {
    const rng = mulberry32(123);
    let sum = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) sum += rng();
    const mean = sum / n;
    // Mean should be roughly 0.5
    expect(mean).toBeGreaterThan(0.4);
    expect(mean).toBeLessThan(0.6);
  });
});
