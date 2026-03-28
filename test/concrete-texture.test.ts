import { describe, it, expect } from "vitest";
import { concreteLayerType } from "../src/concrete-texture.js";
import { createMockCtx, BOUNDS, EMPTY_RESOURCES } from "./helpers.js";

describe("textures:concrete", () => {
  it("has correct typeId", () => {
    expect(concreteLayerType.typeId).toBe("textures:concrete");
  });

  it("has category draw", () => {
    expect(concreteLayerType.category).toBe("draw");
  });

  it("createDefault returns valid properties", () => {
    const defaults = concreteLayerType.createDefault();
    expect(defaults.coarseness).toBe(0.5);
    expect(defaults.pitting).toBe(0.3);
    expect(defaults.variation).toBe(0.2);
    expect(defaults.color).toBe("#b0aba3");
    expect(defaults.seed).toBe(0);
  });

  it("render produces non-empty output with defaults", () => {
    const ctx = createMockCtx();
    concreteLayerType.render(concreteLayerType.createDefault(), ctx, BOUNDS, EMPTY_RESOURCES);

    expect(ctx.createImageData).toHaveBeenCalledWith(400, 300);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    const imageData = (ctx.createImageData as any).mock.results[0].value;
    const hasNonZero = imageData.data.some((v: number) => v > 0);
    expect(hasNonZero).toBe(true);
  });

  it("render with high coarseness", () => {
    const ctx = createMockCtx();
    const props = { ...concreteLayerType.createDefault(), coarseness: 1.0 };
    expect(() => concreteLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
  });

  it("render with max pitting", () => {
    const ctx = createMockCtx();
    const props = { ...concreteLayerType.createDefault(), pitting: 1.0 };
    expect(() => concreteLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
  });

  it("render with zero variation (no flecks)", () => {
    const ctx = createMockCtx();
    const props = { ...concreteLayerType.createDefault(), variation: 0 };
    expect(() => concreteLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
  });

  it("render skips zero-area bounds", () => {
    const ctx = createMockCtx();
    concreteLayerType.render(concreteLayerType.createDefault(), ctx, { ...BOUNDS, width: 0 }, EMPTY_RESOURCES);
    expect(ctx.createImageData).not.toHaveBeenCalled();
  });

  it("all pixels have full alpha", () => {
    const ctx = createMockCtx();
    concreteLayerType.render(concreteLayerType.createDefault(), ctx, BOUNDS, EMPTY_RESOURCES);
    const data = (ctx.createImageData as any).mock.results[0].value.data;
    for (let i = 3; i < data.length; i += 4) {
      expect(data[i]).toBe(255);
    }
  });

  it("different seeds produce different output", () => {
    const ctx1 = createMockCtx();
    const ctx2 = createMockCtx();
    concreteLayerType.render({ ...concreteLayerType.createDefault(), seed: 0 }, ctx1, BOUNDS, EMPTY_RESOURCES);
    concreteLayerType.render({ ...concreteLayerType.createDefault(), seed: 300 }, ctx2, BOUNDS, EMPTY_RESOURCES);

    const data1 = (ctx1.createImageData as any).mock.results[0].value.data;
    const data2 = (ctx2.createImageData as any).mock.results[0].value.data;
    let differ = false;
    for (let i = 0; i < data1.length; i++) {
      if (data1[i] !== data2[i]) { differ = true; break; }
    }
    expect(differ).toBe(true);
  });

  it("validate returns null", () => {
    expect(concreteLayerType.validate({})).toBeNull();
  });
});
