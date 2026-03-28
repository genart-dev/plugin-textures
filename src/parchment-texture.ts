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

const PARCHMENT_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "aging",
    label: "Aging",
    type: "number",
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    group: "parchment",
  },
  {
    key: "foxingDensity",
    label: "Foxing Density",
    type: "number",
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    group: "parchment",
  },
  {
    key: "stainIntensity",
    label: "Stain Intensity",
    type: "number",
    default: 0.4,
    min: 0,
    max: 1,
    step: 0.01,
    group: "parchment",
  },
  {
    key: "edgeDarkening",
    label: "Edge Darkening",
    type: "number",
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    group: "parchment",
  },
  {
    key: "color",
    label: "Base Color",
    type: "color",
    default: "#ede4d3",
    group: "parchment",
  },
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 0,
    min: 0,
    max: 99999,
    step: 1,
    group: "parchment",
  },
];

export const parchmentLayerType: LayerTypeDefinition = {
  typeId: "textures:parchment",
  displayName: "Parchment / Aged Paper",
  icon: "parchment",
  category: "draw",
  properties: PARCHMENT_PROPERTIES,
  propertyEditorId: "textures:parchment-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of PARCHMENT_PROPERTIES) {
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
    const aging = (properties.aging as number) ?? 0.5;
    const foxingDensity = (properties.foxingDensity as number) ?? 0.3;
    const stainIntensity = (properties.stainIntensity as number) ?? 0.4;
    const edgeDarkening = (properties.edgeDarkening as number) ?? 0.3;
    const colorHex = (properties.color as string) ?? "#ede4d3";
    const seed = (properties.seed as number) ?? 0;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const rand = mulberry32(seed);
    const baseNoise = createFractalNoise(seed, 4);
    const stainNoise = createFractalNoise(seed + 7919, 3);
    const foxNoise = createValueNoise(seed + 3571);

    const [cr, cg, cb] = hexToRgba(colorHex);

    // Pre-generate foxing spot positions
    const foxingCount = Math.round(foxingDensity * (w + h) * 0.15);
    const foxSpots: Array<{ cx: number; cy: number; r: number; intensity: number }> = [];
    for (let i = 0; i < foxingCount; i++) {
      foxSpots.push({
        cx: rand() * w,
        cy: rand() * h,
        r: 2 + rand() * 8,
        intensity: 0.1 + rand() * 0.25,
      });
    }

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    const invW = 1 / w;
    const invH = 1 / h;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Base paper grain
        const grain = baseNoise(px * 0.015, py * 0.015) * aging * 0.12;

        // Large amorphous stains — warm tea/coffee tint
        const stain = stainNoise(px * 0.004, py * 0.004);
        const stainFactor = stain > 0.55
          ? (stain - 0.55) * (1 / 0.45) * stainIntensity * 0.2
          : 0;

        // Edge darkening — vignette
        const nx = (px * invW - 0.5) * 2;
        const ny = (py * invH - 0.5) * 2;
        const edgeDist = Math.sqrt(nx * nx + ny * ny);
        const edgeFactor = Math.max(0, (edgeDist - 0.6) * (1 / 0.4)) * edgeDarkening * 0.25;

        // Foxing: small brownish spots
        let foxFactor = 0;
        for (const spot of foxSpots) {
          const dx = px - spot.cx;
          const dy = py - spot.cy;
          const d2 = dx * dx + dy * dy;
          const r2 = spot.r * spot.r;
          if (d2 < r2) {
            // Soft falloff with noise modulation
            const falloff = 1 - d2 / r2;
            const nMod = foxNoise(px * 0.1, py * 0.1);
            foxFactor = Math.max(foxFactor, falloff * spot.intensity * nMod);
          }
        }

        // Combine all effects — darkening shifts toward warm brown
        const totalDarken = grain + stainFactor + edgeFactor + foxFactor;
        const value = Math.max(0, 1.0 - totalDarken);

        // Staining and foxing shift hue toward warm brown (reduce blue more)
        const warmShift = stainFactor + foxFactor * 0.5;
        const rVal = clamp255(cr! * value);
        const gVal = clamp255(cg! * value * (1 - warmShift * 0.15));
        const bVal = clamp255(cb! * value * (1 - warmShift * 0.35));

        const i = (py * w + px) * 4;
        data[i]     = rVal;
        data[i + 1] = gVal;
        data[i + 2] = bVal;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(_properties: LayerProperties): ValidationError[] | null {
    return null;
  },
};
