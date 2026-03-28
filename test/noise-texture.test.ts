import { describe, it, expect } from "vitest";
import { noiseTextureLayerType } from "../src/noise-texture.js";
import { createMockCtx, BOUNDS, EMPTY_RESOURCES } from "./helpers.js";

describe("textures:noise", () => {
  it("has correct typeId", () => {
    expect(noiseTextureLayerType.typeId).toBe("textures:noise");
  });

  it("has category draw", () => {
    expect(noiseTextureLayerType.category).toBe("draw");
  });

  it("createDefault returns valid properties", () => {
    const defaults = noiseTextureLayerType.createDefault();
    expect(defaults.type).toBe("fractal");
    expect(defaults.scale).toBe(80);
    expect(defaults.octaves).toBe(4);
    expect(defaults.colorA).toBe("#ffffff");
    expect(defaults.colorB).toBe("#000000");
    expect(defaults.seed).toBe(0);
  });

  it("render produces non-empty output with defaults", () => {
    const ctx = createMockCtx();
    const props = noiseTextureLayerType.createDefault();
    noiseTextureLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES);

    expect(ctx.createImageData).toHaveBeenCalledWith(400, 300);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    const imageData = (ctx.createImageData as any).mock.results[0].value;
    const hasNonZero = imageData.data.some((v: number) => v > 0);
    expect(hasNonZero).toBe(true);
  });

  it("render works for each noise type", () => {
    for (const type of ["value", "fractal", "ridged"]) {
      const ctx = createMockCtx();
      const props = { ...noiseTextureLayerType.createDefault(), type };
      expect(() => noiseTextureLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
      expect(ctx.putImageData).toHaveBeenCalledTimes(1);
    }
  });

  it("render skips zero-area bounds", () => {
    const ctx = createMockCtx();
    noiseTextureLayerType.render(noiseTextureLayerType.createDefault(), ctx, { ...BOUNDS, width: 0 }, EMPTY_RESOURCES);
    expect(ctx.createImageData).not.toHaveBeenCalled();
  });

  it("output varies between colorA and colorB", () => {
    const ctx = createMockCtx();
    noiseTextureLayerType.render(
      { ...noiseTextureLayerType.createDefault(), colorA: "#ff0000", colorB: "#0000ff" },
      ctx, BOUNDS, EMPTY_RESOURCES,
    );
    const data = (ctx.createImageData as any).mock.results[0].value.data;

    // Should have variation — not all identical pixels
    let minR = 255, maxR = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < minR) minR = data[i];
      if (data[i] > maxR) maxR = data[i];
    }
    expect(maxR - minR).toBeGreaterThan(10);
  });

  it("all pixels have full alpha", () => {
    const ctx = createMockCtx();
    noiseTextureLayerType.render(noiseTextureLayerType.createDefault(), ctx, BOUNDS, EMPTY_RESOURCES);
    const data = (ctx.createImageData as any).mock.results[0].value.data;
    for (let i = 3; i < data.length; i += 4) {
      expect(data[i]).toBe(255);
    }
  });

  it("different seeds produce different output", () => {
    const ctx1 = createMockCtx();
    const ctx2 = createMockCtx();
    noiseTextureLayerType.render({ ...noiseTextureLayerType.createDefault(), seed: 0 }, ctx1, BOUNDS, EMPTY_RESOURCES);
    noiseTextureLayerType.render({ ...noiseTextureLayerType.createDefault(), seed: 777 }, ctx2, BOUNDS, EMPTY_RESOURCES);

    const data1 = (ctx1.createImageData as any).mock.results[0].value.data;
    const data2 = (ctx2.createImageData as any).mock.results[0].value.data;
    let differ = false;
    for (let i = 0; i < data1.length; i++) {
      if (data1[i] !== data2[i]) { differ = true; break; }
    }
    expect(differ).toBe(true);
  });

  it("validate returns null (no validation)", () => {
    expect(noiseTextureLayerType.validate({})).toBeNull();
  });
});
