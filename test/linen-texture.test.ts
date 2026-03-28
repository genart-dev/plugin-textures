import { describe, it, expect } from "vitest";
import { linenLayerType } from "../src/linen-texture.js";
import { createMockCtx, BOUNDS, EMPTY_RESOURCES } from "./helpers.js";

describe("textures:linen", () => {
  it("has correct typeId", () => {
    expect(linenLayerType.typeId).toBe("textures:linen");
  });

  it("has category draw", () => {
    expect(linenLayerType.category).toBe("draw");
  });

  it("createDefault returns valid properties", () => {
    const defaults = linenLayerType.createDefault();
    expect(defaults.threadSpacing).toBe(3);
    expect(defaults.warpWeight).toBe(0.5);
    expect(defaults.weftWeight).toBe(0.4);
    expect(defaults.irregularity).toBe(0.15);
    expect(defaults.color).toBe("#e8e0d0");
    expect(defaults.seed).toBe(0);
  });

  it("render produces non-empty output with defaults", () => {
    const ctx = createMockCtx();
    linenLayerType.render(linenLayerType.createDefault(), ctx, BOUNDS, EMPTY_RESOURCES);

    expect(ctx.createImageData).toHaveBeenCalledWith(400, 300);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    const imageData = (ctx.createImageData as any).mock.results[0].value;
    const hasNonZero = imageData.data.some((v: number) => v > 0);
    expect(hasNonZero).toBe(true);
  });

  it("render with varied thread spacing", () => {
    for (const threadSpacing of [1, 5, 10]) {
      const ctx = createMockCtx();
      const props = { ...linenLayerType.createDefault(), threadSpacing };
      expect(() => linenLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
      expect(ctx.putImageData).toHaveBeenCalledTimes(1);
    }
  });

  it("render skips zero-area bounds", () => {
    const ctx = createMockCtx();
    linenLayerType.render(linenLayerType.createDefault(), ctx, { ...BOUNDS, width: 0 }, EMPTY_RESOURCES);
    expect(ctx.createImageData).not.toHaveBeenCalled();
  });

  it("all pixels have full alpha", () => {
    const ctx = createMockCtx();
    linenLayerType.render(linenLayerType.createDefault(), ctx, BOUNDS, EMPTY_RESOURCES);
    const data = (ctx.createImageData as any).mock.results[0].value.data;
    for (let i = 3; i < data.length; i += 4) {
      expect(data[i]).toBe(255);
    }
  });

  it("different seeds produce different output", () => {
    const ctx1 = createMockCtx();
    const ctx2 = createMockCtx();
    linenLayerType.render({ ...linenLayerType.createDefault(), seed: 0 }, ctx1, BOUNDS, EMPTY_RESOURCES);
    linenLayerType.render({ ...linenLayerType.createDefault(), seed: 55 }, ctx2, BOUNDS, EMPTY_RESOURCES);

    const data1 = (ctx1.createImageData as any).mock.results[0].value.data;
    const data2 = (ctx2.createImageData as any).mock.results[0].value.data;
    let differ = false;
    for (let i = 0; i < data1.length; i++) {
      if (data1[i] !== data2[i]) { differ = true; break; }
    }
    expect(differ).toBe(true);
  });

  it("validate returns null", () => {
    expect(linenLayerType.validate({})).toBeNull();
  });
});
