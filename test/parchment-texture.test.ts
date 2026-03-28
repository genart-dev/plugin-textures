import { describe, it, expect } from "vitest";
import { parchmentLayerType } from "../src/parchment-texture.js";
import { createMockCtx, BOUNDS, EMPTY_RESOURCES } from "./helpers.js";

describe("textures:parchment", () => {
  it("has correct typeId", () => {
    expect(parchmentLayerType.typeId).toBe("textures:parchment");
  });

  it("has category draw", () => {
    expect(parchmentLayerType.category).toBe("draw");
  });

  it("createDefault returns valid properties", () => {
    const defaults = parchmentLayerType.createDefault();
    expect(defaults.aging).toBe(0.5);
    expect(defaults.foxingDensity).toBe(0.3);
    expect(defaults.stainIntensity).toBe(0.4);
    expect(defaults.edgeDarkening).toBe(0.3);
    expect(defaults.color).toBe("#ede4d3");
    expect(defaults.seed).toBe(0);
  });

  it("render produces non-empty output with defaults", () => {
    const ctx = createMockCtx();
    parchmentLayerType.render(parchmentLayerType.createDefault(), ctx, BOUNDS, EMPTY_RESOURCES);

    expect(ctx.createImageData).toHaveBeenCalledWith(400, 300);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    const imageData = (ctx.createImageData as any).mock.results[0].value;
    const hasNonZero = imageData.data.some((v: number) => v > 0);
    expect(hasNonZero).toBe(true);
  });

  it("render with high aging", () => {
    const ctx = createMockCtx();
    const props = { ...parchmentLayerType.createDefault(), aging: 1.0 };
    expect(() => parchmentLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);
  });

  it("render with zero foxing", () => {
    const ctx = createMockCtx();
    const props = { ...parchmentLayerType.createDefault(), foxingDensity: 0 };
    expect(() => parchmentLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
  });

  it("render with max foxing", () => {
    const ctx = createMockCtx();
    const props = { ...parchmentLayerType.createDefault(), foxingDensity: 1.0 };
    expect(() => parchmentLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
  });

  it("render skips zero-area bounds", () => {
    const ctx = createMockCtx();
    parchmentLayerType.render(parchmentLayerType.createDefault(), ctx, { ...BOUNDS, height: 0 }, EMPTY_RESOURCES);
    expect(ctx.createImageData).not.toHaveBeenCalled();
  });

  it("edge darkening produces darker pixels at edges than center", () => {
    const ctx = createMockCtx();
    const props = { ...parchmentLayerType.createDefault(), edgeDarkening: 1.0, foxingDensity: 0, stainIntensity: 0, aging: 0 };
    parchmentLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES);
    const data = (ctx.createImageData as any).mock.results[0].value.data;

    // Center pixel brightness vs corner pixel brightness
    const cx = Math.floor(200);
    const cy = Math.floor(150);
    const centerIdx = (cy * 400 + cx) * 4;
    const cornerIdx = 0; // top-left
    const centerBrightness = data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2];
    const cornerBrightness = data[cornerIdx] + data[cornerIdx + 1] + data[cornerIdx + 2];
    expect(centerBrightness).toBeGreaterThan(cornerBrightness);
  });

  it("different seeds produce different output", () => {
    const ctx1 = createMockCtx();
    const ctx2 = createMockCtx();
    parchmentLayerType.render({ ...parchmentLayerType.createDefault(), seed: 0 }, ctx1, BOUNDS, EMPTY_RESOURCES);
    parchmentLayerType.render({ ...parchmentLayerType.createDefault(), seed: 123 }, ctx2, BOUNDS, EMPTY_RESOURCES);

    const data1 = (ctx1.createImageData as any).mock.results[0].value.data;
    const data2 = (ctx2.createImageData as any).mock.results[0].value.data;
    let differ = false;
    for (let i = 0; i < data1.length; i++) {
      if (data1[i] !== data2[i]) { differ = true; break; }
    }
    expect(differ).toBe(true);
  });

  it("validate returns null", () => {
    expect(parchmentLayerType.validate({})).toBeNull();
  });
});
