import { describe, it, expect } from "vitest";
import { hexToRgba, lerp, clamp255, blendMultiply } from "../src/shared/pixel-utils.js";

describe("hexToRgba", () => {
  it("parses 6-digit hex", () => {
    expect(hexToRgba("#ff0000")).toEqual([255, 0, 0, 255]);
    expect(hexToRgba("#00ff00")).toEqual([0, 255, 0, 255]);
    expect(hexToRgba("#0000ff")).toEqual([0, 0, 255, 255]);
  });

  it("parses without hash", () => {
    expect(hexToRgba("ff8800")).toEqual([255, 136, 0, 255]);
  });

  it("parses 3-digit hex", () => {
    expect(hexToRgba("#f00")).toEqual([255, 0, 0, 255]);
    expect(hexToRgba("#fff")).toEqual([255, 255, 255, 255]);
  });

  it("always returns alpha 255", () => {
    expect(hexToRgba("#000000")[3]).toBe(255);
  });
});

describe("lerp", () => {
  it("returns a at t=0", () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it("returns b at t=1", () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("returns midpoint at t=0.5", () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });
});

describe("clamp255", () => {
  it("clamps negative to 0", () => {
    expect(clamp255(-10)).toBe(0);
  });

  it("clamps above 255", () => {
    expect(clamp255(300)).toBe(255);
  });

  it("rounds to nearest integer", () => {
    expect(clamp255(127.6)).toBe(128);
    expect(clamp255(127.4)).toBe(127);
  });

  it("passes through valid values", () => {
    expect(clamp255(128)).toBe(128);
  });
});

describe("blendMultiply", () => {
  it("white * white = white", () => {
    expect(blendMultiply(255, 255)).toBe(255);
  });

  it("anything * black = black", () => {
    expect(blendMultiply(200, 0)).toBe(0);
  });

  it("50% * 50% ≈ 25%", () => {
    expect(blendMultiply(128, 128)).toBe(Math.round((128 * 128) / 255));
  });
});
