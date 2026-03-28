import { describe, it, expect } from "vitest";
import { paperLayerType } from "../src/paper-texture.js";
import { createMockCtx, BOUNDS, EMPTY_RESOURCES } from "./helpers.js";

describe("textures:paper", () => {
  it("has correct typeId", () => {
    expect(paperLayerType.typeId).toBe("textures:paper");
  });

  it("has category draw", () => {
    expect(paperLayerType.category).toBe("draw");
  });

  it("createDefault returns valid properties", () => {
    const defaults = paperLayerType.createDefault();
    expect(defaults.preset).toBe("cold-press");
    expect(defaults.color).toBe("#f8f4ee");
    expect(defaults.seed).toBe(0);
    expect(defaults.roughness).toBe(-1);
  });

  it("render produces non-empty output with defaults", () => {
    const ctx = createMockCtx();
    const props = paperLayerType.createDefault();
    paperLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES);

    expect(ctx.createImageData).toHaveBeenCalledWith(400, 300);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    const imageData = (ctx.createImageData as any).mock.results[0].value;
    const hasNonZero = imageData.data.some((v: number) => v > 0);
    expect(hasNonZero).toBe(true);
  });

  it("render works for each preset", () => {
    for (const preset of ["smooth", "cold-press", "hot-press", "rough"]) {
      const ctx = createMockCtx();
      const props = { ...paperLayerType.createDefault(), preset };
      expect(() => paperLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
      expect(ctx.putImageData).toHaveBeenCalledTimes(1);
    }
  });

  it("render with roughness override", () => {
    const ctx = createMockCtx();
    const props = { ...paperLayerType.createDefault(), roughness: 0.5 };
    expect(() => paperLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES)).not.toThrow();
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);
  });

  it("render skips zero-area bounds", () => {
    const ctx = createMockCtx();
    const props = paperLayerType.createDefault();
    paperLayerType.render(props, ctx, { ...BOUNDS, width: 0 }, EMPTY_RESOURCES);
    expect(ctx.createImageData).not.toHaveBeenCalled();
  });

  it("validate accepts valid roughness", () => {
    expect(paperLayerType.validate({ roughness: 0.5 })).toBeNull();
    expect(paperLayerType.validate({ roughness: -1 })).toBeNull();
    expect(paperLayerType.validate({ roughness: 0 })).toBeNull();
    expect(paperLayerType.validate({ roughness: 1 })).toBeNull();
  });

  it("validate rejects invalid roughness", () => {
    const errors = paperLayerType.validate({ roughness: 1.5 });
    expect(errors).not.toBeNull();
    expect(errors![0]!.property).toBe("roughness");
  });

  it("different seeds produce different output", () => {
    const ctx1 = createMockCtx();
    const ctx2 = createMockCtx();
    paperLayerType.render({ ...paperLayerType.createDefault(), seed: 0 }, ctx1, BOUNDS, EMPTY_RESOURCES);
    paperLayerType.render({ ...paperLayerType.createDefault(), seed: 42 }, ctx2, BOUNDS, EMPTY_RESOURCES);

    const data1 = (ctx1.createImageData as any).mock.results[0].value.data;
    const data2 = (ctx2.createImageData as any).mock.results[0].value.data;
    let differ = false;
    for (let i = 0; i < data1.length; i++) {
      if (data1[i] !== data2[i]) { differ = true; break; }
    }
    expect(differ).toBe(true);
  });
});
