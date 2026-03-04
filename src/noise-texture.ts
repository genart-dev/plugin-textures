import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { createValueNoise, createFractalNoise } from "./shared/noise.js";
import { hexToRgba, lerp, clamp255 } from "./shared/pixel-utils.js";

const NOISE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "type",
    label: "Noise Type",
    type: "select",
    default: "fractal",
    options: [
      { value: "value",   label: "Value" },
      { value: "fractal", label: "Fractal (fBm)" },
      { value: "ridged",  label: "Ridged" },
    ],
    group: "noise",
  },
  {
    key: "scale",
    label: "Scale",
    type: "number",
    default: 80,
    min: 1,
    max: 200,
    step: 1,
    group: "noise",
  },
  {
    key: "octaves",
    label: "Octaves",
    type: "number",
    default: 4,
    min: 1,
    max: 6,
    step: 1,
    group: "noise",
  },
  {
    key: "colorA",
    label: "Color A (low)",
    type: "color",
    default: "#ffffff",
    group: "noise",
  },
  {
    key: "colorB",
    label: "Color B (high)",
    type: "color",
    default: "#000000",
    group: "noise",
  },
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 0,
    min: 0,
    max: 99999,
    step: 1,
    group: "noise",
  },
];

export const noiseTextureLayerType: LayerTypeDefinition = {
  typeId: "textures:noise",
  displayName: "Noise Texture",
  icon: "noise",
  category: "draw",
  properties: NOISE_PROPERTIES,
  propertyEditorId: "textures:noise-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of NOISE_PROPERTIES) {
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
    const noiseType = (properties.type as string) ?? "fractal";
    const scale = (properties.scale as number) ?? 80;
    const octaves = Math.round((properties.octaves as number) ?? 4);
    const colorAHex = (properties.colorA as string) ?? "#ffffff";
    const colorBHex = (properties.colorB as string) ?? "#000000";
    const seed = (properties.seed as number) ?? 0;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const noiseFn = noiseType === "value"
      ? createValueNoise(seed)
      : createFractalNoise(seed, octaves);

    const [ar, ag, ab] = hexToRgba(colorAHex);
    const [br, bg, bb] = hexToRgba(colorBHex);

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        let n = noiseFn(px / scale, py / scale);

        // Ridged: invert and sharpen
        if (noiseType === "ridged") n = 1 - Math.abs(n * 2 - 1);

        const i = (py * w + px) * 4;
        data[i]     = clamp255(lerp(ar!, br!, n));
        data[i + 1] = clamp255(lerp(ag!, bg!, n));
        data[i + 2] = clamp255(lerp(ab!, bb!, n));
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(_properties: LayerProperties): ValidationError[] | null {
    return null;
  },
};
