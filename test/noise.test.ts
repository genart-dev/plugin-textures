import { describe, it, expect } from "vitest";
import { createValueNoise, createFractalNoise } from "../src/shared/noise.js";

describe("createValueNoise", () => {
  it("returns values in [0, 1]", () => {
    const noise = createValueNoise(0);
    for (let i = 0; i < 100; i++) {
      const v = noise(i * 0.1, i * 0.07);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for same seed", () => {
    const a = createValueNoise(42);
    const b = createValueNoise(42);
    for (let i = 0; i < 20; i++) {
      expect(a(i * 0.3, i * 0.2)).toBe(b(i * 0.3, i * 0.2));
    }
  });

  it("different seeds produce different values", () => {
    const a = createValueNoise(0);
    const b = createValueNoise(1);
    let differ = false;
    for (let i = 0; i < 20; i++) {
      if (a(i * 0.3, i * 0.2) !== b(i * 0.3, i * 0.2)) { differ = true; break; }
    }
    expect(differ).toBe(true);
  });
});

describe("createFractalNoise", () => {
  it("returns values in [0, 1]", () => {
    const noise = createFractalNoise(0, 4);
    for (let i = 0; i < 100; i++) {
      const v = noise(i * 0.1, i * 0.07);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for same seed and octaves", () => {
    const a = createFractalNoise(7, 3);
    const b = createFractalNoise(7, 3);
    for (let i = 0; i < 20; i++) {
      expect(a(i * 0.5, i * 0.3)).toBe(b(i * 0.5, i * 0.3));
    }
  });

  it("more octaves add detail (different results)", () => {
    const low = createFractalNoise(0, 1);
    const high = createFractalNoise(0, 6);
    let differ = false;
    for (let i = 0; i < 20; i++) {
      if (low(i * 0.3, i * 0.2) !== high(i * 0.3, i * 0.2)) { differ = true; break; }
    }
    expect(differ).toBe(true);
  });
});
