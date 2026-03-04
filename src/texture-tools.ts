import type {
  McpToolDefinition,
  McpToolContext,
  McpToolResult,
  JsonSchema,
  DesignLayer,
  LayerTransform,
} from "@genart-dev/core";
import { paperLayerType } from "./paper-texture.js";
import { canvasLayerType } from "./canvas-texture.js";
import { washiLayerType } from "./washi-texture.js";
import { noiseTextureLayerType } from "./noise-texture.js";

function textResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

function errorResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

function generateLayerId(): string {
  return `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function fullCanvasTransform(ctx: McpToolContext): LayerTransform {
  return {
    x: 0, y: 0,
    width: ctx.canvasWidth,
    height: ctx.canvasHeight,
    rotation: 0, scaleX: 1, scaleY: 1, anchorX: 0, anchorY: 0,
  };
}

function createTextureLayer(
  typeId: string,
  name: string,
  properties: Record<string, unknown>,
  opacity: number,
  ctx: McpToolContext,
): DesignLayer {
  return {
    id: generateLayerId(),
    type: typeId,
    name,
    visible: true,
    locked: false,
    opacity,
    blendMode: "multiply",
    transform: fullCanvasTransform(ctx),
    properties: properties as Record<string, string | number | boolean | null>,
  };
}

// ---------------------------------------------------------------------------

export const addPaperTextureTool: McpToolDefinition = {
  name: "add_paper_texture",
  description:
    "Add a watercolor paper texture layer (cold-press, rough, smooth, hot-press). Place at the bottom of the stack under painting layers.",
  inputSchema: {
    type: "object",
    properties: {
      preset: {
        type: "string",
        enum: ["smooth", "cold-press", "hot-press", "rough"],
        description: 'Paper surface preset (default: "cold-press").',
      },
      roughness: {
        type: "number",
        description: "Roughness override 0–1. Omit to use preset value.",
      },
      color: {
        type: "string",
        description: 'Paper color as hex (default: "#f8f4ee").',
      },
      opacity: {
        type: "number",
        description: "Layer opacity 0–1 (default: 1.0).",
      },
      seed: {
        type: "number",
        description: "Random seed (default: 0).",
      },
      index: {
        type: "number",
        description: "Stack position (default: 0 = bottom).",
      },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const properties = { ...paperLayerType.createDefault() };
    if (input.preset !== undefined) properties.preset = input.preset as string;
    if (input.roughness !== undefined) properties.roughness = input.roughness as number;
    else properties.roughness = -1; // use preset
    if (input.color !== undefined) properties.color = input.color as string;
    if (input.seed !== undefined) properties.seed = input.seed as number;

    const opacity = typeof input.opacity === "number" ? input.opacity : 1;
    const idx = typeof input.index === "number" ? input.index : 0;
    const layer = createTextureLayer("textures:paper", "Paper Texture", properties, opacity, context);
    context.layers.add(layer, idx);
    context.emitChange("layer-added");
    return textResult(`Added paper texture layer '${layer.id}' (preset: ${properties.preset}).`);
  },
};

export const addCanvasTextureTool: McpToolDefinition = {
  name: "add_canvas_texture",
  description: "Add a woven canvas/linen texture layer.",
  inputSchema: {
    type: "object",
    properties: {
      weaveScale: { type: "number", description: "Fiber spacing in px 1–20 (default: 6)." },
      density:    { type: "number", description: "Weave density 0–1 (default: 0.6)." },
      roughness:  { type: "number", description: "Surface roughness 0–1 (default: 0.4)." },
      color:      { type: "string", description: 'Color hex (default: "#f0ece4").' },
      opacity:    { type: "number", description: "Layer opacity 0–1 (default: 1.0)." },
      seed:       { type: "number", description: "Random seed (default: 0)." },
      index:      { type: "number", description: "Stack position (default: 0)." },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const properties = { ...canvasLayerType.createDefault(), ...filterKnown(input, ["weaveScale", "density", "roughness", "color", "seed"]) };
    const opacity = typeof input.opacity === "number" ? input.opacity : 1;
    const idx = typeof input.index === "number" ? input.index : 0;
    const layer = createTextureLayer("textures:canvas", "Canvas Texture", properties, opacity, context);
    context.layers.add(layer, idx);
    context.emitChange("layer-added");
    return textResult(`Added canvas texture layer '${layer.id}'.`);
  },
};

export const addWashiTextureTool: McpToolDefinition = {
  name: "add_washi_texture",
  description: "Add a Japanese washi (rice paper) texture layer with visible fibers.",
  inputSchema: {
    type: "object",
    properties: {
      fiberDensity: { type: "number", description: "Fiber density 0–1 (default: 0.5)." },
      fiberLength:  { type: "number", description: "Fiber length in px 20–200 (default: 80)." },
      color:        { type: "string", description: 'Color hex (default: "#f5f0e8").' },
      opacity:      { type: "number", description: "Layer opacity 0–1 (default: 1.0)." },
      seed:         { type: "number", description: "Random seed (default: 0)." },
      index:        { type: "number", description: "Stack position (default: 0)." },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const properties = { ...washiLayerType.createDefault(), ...filterKnown(input, ["fiberDensity", "fiberLength", "color", "seed"]) };
    const opacity = typeof input.opacity === "number" ? input.opacity : 1;
    const idx = typeof input.index === "number" ? input.index : 0;
    const layer = createTextureLayer("textures:washi", "Washi Paper", properties, opacity, context);
    context.layers.add(layer, idx);
    context.emitChange("layer-added");
    return textResult(`Added washi texture layer '${layer.id}'.`);
  },
};

export const addNoiseTextureTool: McpToolDefinition = {
  name: "add_noise_texture",
  description: "Add a procedural noise texture layer (value, fractal, or ridged).",
  inputSchema: {
    type: "object",
    properties: {
      type:    { type: "string", enum: ["value", "fractal", "ridged"], description: 'Noise type (default: "fractal").' },
      scale:   { type: "number", description: "Noise scale 1–200 (default: 80)." },
      octaves: { type: "number", description: "Octaves 1–6 for fractal/ridged (default: 4)." },
      colorA:  { type: "string", description: 'Low-value color hex (default: "#ffffff").' },
      colorB:  { type: "string", description: 'High-value color hex (default: "#000000").' },
      opacity: { type: "number", description: "Layer opacity 0–1 (default: 1.0)." },
      seed:    { type: "number", description: "Random seed (default: 0)." },
      index:   { type: "number", description: "Stack position (default: 0)." },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const properties = { ...noiseTextureLayerType.createDefault(), ...filterKnown(input, ["type", "scale", "octaves", "colorA", "colorB", "seed"]) };
    const opacity = typeof input.opacity === "number" ? input.opacity : 1;
    const idx = typeof input.index === "number" ? input.index : 0;
    const layer = createTextureLayer("textures:noise", "Noise Texture", properties, opacity, context);
    context.layers.add(layer, idx);
    context.emitChange("layer-added");
    return textResult(`Added noise texture layer '${layer.id}' (type: ${properties.type}).`);
  },
};

function filterKnown(
  input: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (input[k] !== undefined) out[k] = input[k];
  }
  return out;
}

export const textureMcpTools: McpToolDefinition[] = [
  addPaperTextureTool,
  addCanvasTextureTool,
  addWashiTextureTool,
  addNoiseTextureTool,
];
