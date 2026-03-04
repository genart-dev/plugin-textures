import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { createFractalNoise } from "./shared/noise.js";
import { hexToRgba, lerp, clamp255 } from "./shared/pixel-utils.js";

// Preset → { roughness multiplier, grainScale, octaves }
const PRESETS: Record<string, { roughness: number; grainScale: number; octaves: number }> = {
  smooth:     { roughness: 0.08, grainScale: 3.5,  octaves: 3 },
  "cold-press": { roughness: 0.18, grainScale: 2.2,  octaves: 4 },
  "hot-press":  { roughness: 0.10, grainScale: 4.0,  octaves: 3 },
  rough:      { roughness: 0.32, grainScale: 1.4,  octaves: 5 },
};

const PAPER_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "preset",
    label: "Preset",
    type: "select",
    default: "cold-press",
    options: [
      { value: "smooth",     label: "Smooth" },
      { value: "cold-press", label: "Cold Press" },
      { value: "hot-press",  label: "Hot Press" },
      { value: "rough",      label: "Rough" },
    ],
    group: "paper",
  },
  {
    key: "roughness",
    label: "Roughness Override",
    type: "number",
    default: -1,   // -1 = use preset
    min: -1,
    max: 1,
    step: 0.01,
    group: "paper",
  },
  {
    key: "color",
    label: "Paper Color",
    type: "color",
    default: "#f8f4ee",
    group: "paper",
  },
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 0,
    min: 0,
    max: 99999,
    step: 1,
    group: "paper",
  },
];

export const paperLayerType: LayerTypeDefinition = {
  typeId: "textures:paper",
  displayName: "Paper Texture",
  icon: "paper",
  category: "draw",
  properties: PAPER_PROPERTIES,
  propertyEditorId: "textures:paper-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of PAPER_PROPERTIES) {
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
    const presetKey = (properties.preset as string) ?? "cold-press";
    const preset = PRESETS[presetKey] ?? PRESETS["cold-press"]!;
    const roughnessOverride = properties.roughness as number;
    const roughness = roughnessOverride >= 0 ? roughnessOverride : preset.roughness;
    const colorHex = (properties.color as string) ?? "#f8f4ee";
    const seed = (properties.seed as number) ?? 0;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const noise = createFractalNoise(seed, preset.octaves);
    const [pr, pg, pb] = hexToRgba(colorHex);

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const nx = px / preset.grainScale;
        const ny = py / preset.grainScale;
        const n = noise(nx, ny);

        // Paper stays light — valleys go slightly darker
        // roughness controls the depth of the darkening
        const value = lerp(1 - roughness * 0.9, 1.0, n);

        const i = (py * w + px) * 4;
        data[i]     = clamp255(pr! * value);
        data[i + 1] = clamp255(pg! * value);
        data[i + 2] = clamp255(pb! * value);
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const roughness = properties.roughness as number;
    if (typeof roughness === "number" && roughness !== -1 && (roughness < 0 || roughness > 1)) {
      errors.push({ property: "roughness", message: "Roughness must be 0–1 (or -1 to use preset)" });
    }
    return errors.length > 0 ? errors : null;
  },
};
