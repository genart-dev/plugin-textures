import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { mulberry32 } from "./shared/prng.js";
import { hexToRgba, clamp255 } from "./shared/pixel-utils.js";

const WASHI_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "fiberDensity",
    label: "Fiber Density",
    type: "number",
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    group: "washi",
  },
  {
    key: "fiberLength",
    label: "Fiber Length (px)",
    type: "number",
    default: 80,
    min: 20,
    max: 200,
    step: 5,
    group: "washi",
  },
  {
    key: "color",
    label: "Color",
    type: "color",
    default: "#f5f0e8",
    group: "washi",
  },
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 0,
    min: 0,
    max: 99999,
    step: 1,
    group: "washi",
  },
];

export const washiLayerType: LayerTypeDefinition = {
  typeId: "textures:washi",
  displayName: "Washi Paper",
  icon: "washi",
  category: "draw",
  properties: WASHI_PROPERTIES,
  propertyEditorId: "textures:washi-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of WASHI_PROPERTIES) {
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
    const fiberDensity = (properties.fiberDensity as number) ?? 0.5;
    const fiberLength = (properties.fiberLength as number) ?? 80;
    const colorHex = (properties.color as string) ?? "#f5f0e8";
    const seed = (properties.seed as number) ?? 0;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const [cr, cg, cb] = hexToRgba(colorHex);
    const rand = mulberry32(seed);

    // Fill warm base
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < w * h * 4; i += 4) {
      data[i]     = cr!;
      data[i + 1] = cg!;
      data[i + 2] = cb!;
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, bounds.x, bounds.y);

    // Draw long semi-transparent fiber streaks
    const fiberCount = Math.round(fiberDensity * (w + h) * 1.5);
    ctx.save();

    for (let f = 0; f < fiberCount; f++) {
      // Start position spread across the full canvas
      const startX = bounds.x + (rand() - 0.1) * w * 1.2;
      const startY = bounds.y + rand() * h;

      // Shallow angle ±15° from horizontal
      const angle = (rand() - 0.5) * (Math.PI / 6);
      const len = fiberLength * (0.4 + rand() * 0.6);
      const endX = startX + Math.cos(angle) * len;
      const endY = startY + Math.sin(angle) * len;

      // Width: 0.2–1.2px; opacity: very subtle
      const lineWidth = 0.2 + rand() * 1.0;
      const alpha = 0.04 + rand() * 0.10;

      // Fiber color: slightly darker or lighter than base
      const tint = rand() > 0.5 ? 0.85 : 1.08;
      const fr = clamp255(cr! * tint);
      const fg = clamp255(cg! * tint);
      const fb = clamp255(cb! * tint);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = `rgba(${fr},${fg},${fb},${alpha.toFixed(3)})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    ctx.restore();
  },

  validate(_properties: LayerProperties): ValidationError[] | null {
    return null;
  },
};
