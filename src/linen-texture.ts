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

const LINEN_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "threadSpacing",
    label: "Thread Spacing",
    type: "number",
    default: 3,
    min: 1,
    max: 10,
    step: 0.5,
    group: "linen",
  },
  {
    key: "warpWeight",
    label: "Warp Weight",
    type: "number",
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    group: "linen",
  },
  {
    key: "weftWeight",
    label: "Weft Weight",
    type: "number",
    default: 0.4,
    min: 0,
    max: 1,
    step: 0.01,
    group: "linen",
  },
  {
    key: "irregularity",
    label: "Irregularity",
    type: "number",
    default: 0.15,
    min: 0,
    max: 1,
    step: 0.01,
    group: "linen",
  },
  {
    key: "color",
    label: "Color",
    type: "color",
    default: "#e8e0d0",
    group: "linen",
  },
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 0,
    min: 0,
    max: 99999,
    step: 1,
    group: "linen",
  },
];

export const linenLayerType: LayerTypeDefinition = {
  typeId: "textures:linen",
  displayName: "Linen Texture",
  icon: "linen",
  category: "draw",
  properties: LINEN_PROPERTIES,
  propertyEditorId: "textures:linen-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of LINEN_PROPERTIES) {
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
    const threadSpacing = (properties.threadSpacing as number) ?? 3;
    const warpWeight = (properties.warpWeight as number) ?? 0.5;
    const weftWeight = (properties.weftWeight as number) ?? 0.4;
    const irregularity = (properties.irregularity as number) ?? 0.15;
    const colorHex = (properties.color as string) ?? "#e8e0d0";
    const seed = (properties.seed as number) ?? 0;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const noise = createValueNoise(seed);
    const [cr, cg, cb] = hexToRgba(colorHex);

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Fine regular weave — alternating warp (vertical) and weft (horizontal) threads
        const warpPhase = Math.abs(Math.sin((py / threadSpacing) * Math.PI));
        const weftPhase = Math.abs(Math.sin((px / threadSpacing) * Math.PI));

        // Plain weave: warp and weft cross at regular intervals
        // Thread prominence alternates based on position in the weave
        const crossover = ((Math.floor(px / threadSpacing) + Math.floor(py / threadSpacing)) % 2) === 0;
        const threadValue = crossover
          ? warpPhase * warpWeight + (1 - weftPhase) * weftWeight * 0.3
          : weftPhase * weftWeight + (1 - warpPhase) * warpWeight * 0.3;

        // Subtle irregularity from low-frequency noise
        const nv = noise(px * 0.03, py * 0.03) * irregularity;

        // Combine: base brightness modulated by thread structure and irregularity
        const value = 1.0 - (threadValue * 0.25 + nv * 0.15);

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
