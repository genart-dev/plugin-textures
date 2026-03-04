import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { createValueNoise } from "./shared/noise.js";
import { hexToRgba, clamp255 } from "./shared/pixel-utils.js";

const CANVAS_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "weaveScale",
    label: "Weave Scale",
    type: "number",
    default: 6,
    min: 1,
    max: 20,
    step: 0.5,
    group: "canvas",
  },
  {
    key: "density",
    label: "Density",
    type: "number",
    default: 0.6,
    min: 0,
    max: 1,
    step: 0.01,
    group: "canvas",
  },
  {
    key: "roughness",
    label: "Roughness",
    type: "number",
    default: 0.4,
    min: 0,
    max: 1,
    step: 0.01,
    group: "canvas",
  },
  {
    key: "color",
    label: "Color",
    type: "color",
    default: "#f0ece4",
    group: "canvas",
  },
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 0,
    min: 0,
    max: 99999,
    step: 1,
    group: "canvas",
  },
];

export const canvasLayerType: LayerTypeDefinition = {
  typeId: "textures:canvas",
  displayName: "Canvas Texture",
  icon: "canvas",
  category: "draw",
  properties: CANVAS_PROPERTIES,
  propertyEditorId: "textures:canvas-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of CANVAS_PROPERTIES) {
      props[schema.key] = schema.default;
    }
    return props;
  },

  render(
    properties: LayerProperties,
    ctx: CanvasRenderingContext2D,
    bounds: LayerBounds,
    _resources: RenderResources,
  ): void {
    const weaveScale = (properties.weaveScale as number) ?? 6;
    const density = (properties.density as number) ?? 0.6;
    const roughness = (properties.roughness as number) ?? 0.4;
    const colorHex = (properties.color as string) ?? "#f0ece4";
    const seed = (properties.seed as number) ?? 0;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const valueNoise = createValueNoise(seed);
    const [cr, cg, cb] = hexToRgba(colorHex);

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Orthogonal sine weave — horizontal and vertical fibers
        const hv = Math.abs(Math.sin((py / weaveScale) * Math.PI));
        const vv = Math.abs(Math.sin((px / weaveScale) * Math.PI));
        const weave = (hv + vv) * 0.5;

        // Low-frequency noise for surface roughness variation
        const n = valueNoise(px * 0.02, py * 0.02) * roughness;

        // value close to 1 = bright fiber; lower = intersection shadow
        const value = 1.0 - (weave * density + n) * 0.3;

        const i = (py * w + px) * 4;
        data[i]     = clamp255(cr! * value);
        data[i + 1] = clamp255(cg! * value);
        data[i + 2] = clamp255(cb! * value);
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(_properties: LayerProperties): ValidationError[] | null {
    return null;
  },
};
