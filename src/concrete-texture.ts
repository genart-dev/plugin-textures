import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { createValueNoise, createFractalNoise } from "./shared/noise.js";
import { mulberry32 } from "./shared/prng.js";
import { hexToRgba, lerp, clamp255 } from "./shared/pixel-utils.js";

const CONCRETE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "coarseness",
    label: "Coarseness",
    type: "number",
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    group: "concrete",
  },
  {
    key: "pitting",
    label: "Pitting",
    type: "number",
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    group: "concrete",
  },
  {
    key: "variation",
    label: "Color Variation",
    type: "number",
    default: 0.2,
    min: 0,
    max: 1,
    step: 0.01,
    group: "concrete",
  },
  {
    key: "color",
    label: "Color",
    type: "color",
    default: "#b0aba3",
    group: "concrete",
  },
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 0,
    min: 0,
    max: 99999,
    step: 1,
    group: "concrete",
  },
];

export const concreteLayerType: LayerTypeDefinition = {
  typeId: "textures:concrete",
  displayName: "Concrete / Stone",
  icon: "concrete",
  category: "draw",
  properties: CONCRETE_PROPERTIES,
  propertyEditorId: "textures:concrete-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of CONCRETE_PROPERTIES) {
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
    const coarseness = (properties.coarseness as number) ?? 0.5;
    const pitting = (properties.pitting as number) ?? 0.3;
    const variation = (properties.variation as number) ?? 0.2;
    const colorHex = (properties.color as string) ?? "#b0aba3";
    const seed = (properties.seed as number) ?? 0;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const rand = mulberry32(seed);

    // Multi-scale noise: coarse aggregate + fine grit + pitting
    const coarseNoise = createFractalNoise(seed, 3, 2.0, 0.5);
    const fineNoise = createValueNoise(seed + 2741);
    const pitNoise = createValueNoise(seed + 6133);

    const [cr, cg, cb] = hexToRgba(colorHex);

    // Pre-scatter some aggregate highlights (lighter mineral flecks)
    const fleckCount = Math.round(variation * w * h * 0.0003);
    const flecks: Array<{ x: number; y: number; r: number; brightness: number }> = [];
    for (let i = 0; i < fleckCount; i++) {
      flecks.push({
        x: rand() * w,
        y: rand() * h,
        r: 1 + rand() * 3,
        brightness: 0.05 + rand() * 0.1,
      });
    }

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    // Coarseness controls the noise frequency — higher = larger grain
    const coarseFreq = lerp(0.02, 0.008, coarseness);
    const fineFreq = lerp(0.08, 0.04, coarseness);

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Coarse aggregate variation
        const cn = coarseNoise(px * coarseFreq, py * coarseFreq);

        // Fine grit — high frequency texture
        const fn = fineNoise(px * fineFreq, py * fineFreq);

        // Pitting: threshold noise to create small dark voids
        const pn = pitNoise(px * 0.05, py * 0.05);
        const pitFactor = pn < pitting * 0.3 ? (pitting * 0.3 - pn) * 2 : 0;

        // Base value: combine scales
        const base = 1.0
          - cn * coarseness * 0.2
          - fn * 0.08
          - pitFactor * 0.3;

        // Color variation: slight warm/cool shifts per region
        const warmth = coarseNoise(px * 0.005 + 100, py * 0.005 + 100) * variation;

        const value = Math.max(0, base);
        const i = (py * w + px) * 4;
        data[i]     = clamp255(cr! * value * (1 + warmth * 0.05));
        data[i + 1] = clamp255(cg! * value);
        data[i + 2] = clamp255(cb! * value * (1 - warmth * 0.05));
        data[i + 3] = 255;
      }
    }

    // Overlay aggregate flecks
    for (const f of flecks) {
      const fx = Math.round(f.x);
      const fy = Math.round(f.y);
      const r = Math.ceil(f.r);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const px2 = fx + dx;
          const py2 = fy + dy;
          if (px2 < 0 || px2 >= w || py2 < 0 || py2 >= h) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 > r * r) continue;
          const falloff = 1 - d2 / (r * r);
          const boost = f.brightness * falloff;
          const i = (py2 * w + px2) * 4;
          data[i]     = clamp255(data[i]! + boost * 255);
          data[i + 1] = clamp255(data[i + 1]! + boost * 255);
          data[i + 2] = clamp255(data[i + 2]! + boost * 255);
        }
      }
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(_properties: LayerProperties): ValidationError[] | null {
    return null;
  },
};
