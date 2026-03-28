import { describe, it, expect } from "vitest";
import { washiLayerType } from "../src/washi-texture.js";
import { createMockCtx, BOUNDS, EMPTY_RESOURCES } from "./helpers.js";

describe("textures:washi", () => {
  it("has correct typeId", () => {
    expect(washiLayerType.typeId).toBe("textures:washi");
  });

  it("has category draw", () => {
    expect(washiLayerType.category).toBe("draw");
  });

  it("createDefault returns valid properties", () => {
    const defaults = washiLayerType.createDefault();
    expect(defaults.fiberDensity).toBe(0.5);
    expect(defaults.fiberLength).toBe(80);
    expect(defaults.color).toBe("#f5f0e8");
    expect(defaults.seed).toBe(0);
  });

  it("render produces base fill and fiber strokes", () => {
    const ctx = createMockCtx();
    const props = washiLayerType.createDefault();
    washiLayerType.render(props, ctx, BOUNDS, EMPTY_RESOURCES);

    // Base fill via putImageData
    expect(ctx.createImageData).toHaveBeenCalledWith(400, 300);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    // Fiber strokes
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
    expect((ctx.beginPath as any).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.stroke as any).mock.calls.length).toBeGreaterThan(0);
  });

  it("fiber count scales with density", () => {
    const ctxLow = createMockCtx();
    const ctxHigh = createMockCtx();
    washiLayerType.render({ ...washiLayerType.createDefault(), fiberDensity: 0.1 }, ctxLow, BOUNDS, EMPTY_RESOURCES);
    washiLayerType.render({ ...washiLayerType.createDefault(), fiberDensity: 1.0 }, ctxHigh, BOUNDS, EMPTY_RESOURCES);

    const lowStrokes = (ctxLow.stroke as any).mock.calls.length;
    const highStrokes = (ctxHigh.stroke as any).mock.calls.length;
    expect(highStrokes).toBeGreaterThan(lowStrokes);
  });

  it("render skips zero-area bounds", () => {
    const ctx = createMockCtx();
    washiLayerType.render(washiLayerType.createDefault(), ctx, { ...BOUNDS, width: 0 }, EMPTY_RESOURCES);
    expect(ctx.createImageData).not.toHaveBeenCalled();
  });

  it("base fill has correct color", () => {
    const ctx = createMockCtx();
    washiLayerType.render({ ...washiLayerType.createDefault(), color: "#ff0000" }, ctx, BOUNDS, EMPTY_RESOURCES);
    const data = (ctx.createImageData as any).mock.results[0].value.data;
    // First pixel should be red
    expect(data[0]).toBe(255);
    expect(data[1]).toBe(0);
    expect(data[2]).toBe(0);
    expect(data[3]).toBe(255);
  });

  it("validate returns null (no validation)", () => {
    expect(washiLayerType.validate({})).toBeNull();
  });
});
