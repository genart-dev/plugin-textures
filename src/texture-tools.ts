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
import { linenLayerType } from "./linen-texture.js";
import { parchmentLayerType } from "./parchment-texture.js";
import { concreteLayerType } from "./concrete-texture.js";

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

export const addLinenTextureTool: McpToolDefinition = {
  name: "add_linen_texture",
  description: "Add a fine linen/fabric weave texture layer with regular thread structure.",
  inputSchema: {
    type: "object",
    properties: {
      threadSpacing: { type: "number", description: "Thread spacing in px 1–10 (default: 3)." },
      warpWeight:    { type: "number", description: "Vertical thread weight 0–1 (default: 0.5)." },
      weftWeight:    { type: "number", description: "Horizontal thread weight 0–1 (default: 0.4)." },
      irregularity:  { type: "number", description: "Weave irregularity 0–1 (default: 0.15)." },
      color:         { type: "string", description: 'Color hex (default: "#e8e0d0").' },
      opacity:       { type: "number", description: "Layer opacity 0–1 (default: 1.0)." },
      seed:          { type: "number", description: "Random seed (default: 0)." },
      index:         { type: "number", description: "Stack position (default: 0)." },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const properties = { ...linenLayerType.createDefault(), ...filterKnown(input, ["threadSpacing", "warpWeight", "weftWeight", "irregularity", "color", "seed"]) };
    const opacity = typeof input.opacity === "number" ? input.opacity : 1;
    const idx = typeof input.index === "number" ? input.index : 0;
    const layer = createTextureLayer("textures:linen", "Linen Texture", properties, opacity, context);
    context.layers.add(layer, idx);
    context.emitChange("layer-added");
    return textResult(`Added linen texture layer '${layer.id}'.`);
  },
};

export const addParchmentTextureTool: McpToolDefinition = {
  name: "add_parchment_texture",
  description: "Add an aged parchment/vellum texture with foxing spots, staining, and edge darkening.",
  inputSchema: {
    type: "object",
    properties: {
      aging:          { type: "number", description: "Overall aging amount 0–1 (default: 0.5)." },
      foxingDensity:  { type: "number", description: "Brown foxing spot density 0–1 (default: 0.3)." },
      stainIntensity: { type: "number", description: "Tea/coffee stain intensity 0–1 (default: 0.4)." },
      edgeDarkening:  { type: "number", description: "Edge vignette darkening 0–1 (default: 0.3)." },
      color:          { type: "string", description: 'Base color hex (default: "#ede4d3").' },
      opacity:        { type: "number", description: "Layer opacity 0–1 (default: 1.0)." },
      seed:           { type: "number", description: "Random seed (default: 0)." },
      index:          { type: "number", description: "Stack position (default: 0)." },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const properties = { ...parchmentLayerType.createDefault(), ...filterKnown(input, ["aging", "foxingDensity", "stainIntensity", "edgeDarkening", "color", "seed"]) };
    const opacity = typeof input.opacity === "number" ? input.opacity : 1;
    const idx = typeof input.index === "number" ? input.index : 0;
    const layer = createTextureLayer("textures:parchment", "Parchment", properties, opacity, context);
    context.layers.add(layer, idx);
    context.emitChange("layer-added");
    return textResult(`Added parchment texture layer '${layer.id}'.`);
  },
};

export const addConcreteTextureTool: McpToolDefinition = {
  name: "add_concrete_texture",
  description: "Add a concrete/stone surface texture with coarse aggregate, pitting, and mineral flecks.",
  inputSchema: {
    type: "object",
    properties: {
      coarseness: { type: "number", description: "Grain coarseness 0–1 (default: 0.5)." },
      pitting:    { type: "number", description: "Surface pitting/voids 0–1 (default: 0.3)." },
      variation:  { type: "number", description: "Color variation 0–1 (default: 0.2)." },
      color:      { type: "string", description: 'Color hex (default: "#b0aba3").' },
      opacity:    { type: "number", description: "Layer opacity 0–1 (default: 1.0)." },
      seed:       { type: "number", description: "Random seed (default: 0)." },
      index:      { type: "number", description: "Stack position (default: 0)." },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const properties = { ...concreteLayerType.createDefault(), ...filterKnown(input, ["coarseness", "pitting", "variation", "color", "seed"]) };
    const opacity = typeof input.opacity === "number" ? input.opacity : 1;
    const idx = typeof input.index === "number" ? input.index : 0;
    const layer = createTextureLayer("textures:concrete", "Concrete", properties, opacity, context);
    context.layers.add(layer, idx);
    context.emitChange("layer-added");
    return textResult(`Added concrete texture layer '${layer.id}'.`);
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
  addLinenTextureTool,
  addParchmentTextureTool,
  addConcreteTextureTool,
];
