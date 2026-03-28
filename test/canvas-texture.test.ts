import { describe, it, expect } from "vitest";
import { canvasLayerType } from "../src/canvas-texture.js";
import { createMockCtx, BOUNDS, EMPTY_RESOURCES } from "./helpers.js";

describe("textures:canvas", () => {
  it("has correct typeId", () => {
    expect(canvasLayerType.typeId).toBe("textures:canvas");
  });

  it("has category draw", () => {
    expect(canvasLayerType.category).toBe("draw");
  });

  it("createDefault returns valid properties", () => {
    const defaults = canvasLayerType.createDefault();
    expect(defaults.weaveScale).toBe(6);
    expect(defaults.density).toBe(0.6);
    expect(defaults.roughness).toBe(0.4);
    expect(defaults.color).toBe("#f0ece4");
    expect(defaults.seed).toBe(0);
  });

  it("render produces non-empty output with defaults", () => {
    const ctx = createMockCtx();
    const props = canvasLayerType.createDefault();
    canvasLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES);

    expect(ctx.createImageData).toHaveBeenCalledWith(400, 300);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    const imageData = (ctx.createImageData as any).mock.results[0].value;
    const hasNonZero = imageData.data.some((v: number) => v > 0);
    expect(hasNonZero).toBe(true);
  });

  it("render with custom weave scale", () => {
    const ctx = createMockCtx();
    const props = { ...canvasLayerType.createDefault(), weaveScale: 12 };
    expect(() => canvasLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);
  });

  it("render skips zero-area bounds", () => {
    const ctx = createMockCtx();
    canvasLayerType.render(canvasLayerType.createDefault(), ctx, { ...BOUNDS, height: 0 }, EMPTY_RESOURCES);
    expect(ctx.createImageData).not.toHaveBeenCalled();
  });

  it("all pixels have full alpha", () => {
    const ctx = createMockCtx();
    canvasLayerType.render(canvasLayerType.createDefault(), ctx, BOUNDS, EMPTY_RESOURCES);
    const data = (ctx.createImageData as any).mock.results[0].value.data;
    for (let i = 3; i < data.length; i += 4) {
      expect(data[i]).toBe(255);
    }
  });

  it("different seeds produce different output", () => {
    const ctx1 = createMockCtx();
    const ctx2 = createMockCtx();
    canvasLayerType.render({ ...canvasLayerType.createDefault(), seed: 0 }, ctx1, BOUNDS, EMPTY_RESOURCES);
    canvasLayerType.render({ ...canvasLayerType.createDefault(), seed: 99 }, ctx2, BOUNDS, EMPTY_RESOURCES);

    const data1 = (ctx1.createImageData as any).mock.results[0].value.data;
    const data2 = (ctx2.createImageData as any).mock.results[0].value.data;
    let differ = false;
    for (let i = 0; i < data1.length; i++) {
      if (data1[i] !== data2[i]) { differ = true; break; }
    }
    expect(differ).toBe(true);
  });

  it("validate returns null (no validation)", () => {
    expect(canvasLayerType.validate({})).toBeNull();
  });
});
