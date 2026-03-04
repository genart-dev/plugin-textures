import type { DesignPlugin, PluginContext } from "@genart-dev/core";
import { paperLayerType } from "./paper-texture.js";
import { canvasLayerType } from "./canvas-texture.js";
import { washiLayerType } from "./washi-texture.js";
import { noiseTextureLayerType } from "./noise-texture.js";
import { textureMcpTools } from "./texture-tools.js";

const texturesPlugin: DesignPlugin = {
  id: "textures",
  name: "Textures",
  version: "0.1.0",
  tier: "free",
  description: "Procedural surface textures: paper, canvas, washi, noise.",

  layerTypes: [paperLayerType, canvasLayerType, washiLayerType, noiseTextureLayerType],
  tools: [],
  exportHandlers: [],
  mcpTools: textureMcpTools,

  async initialize(_context: PluginContext): Promise<void> {},
  dispose(): void {},
};

export default texturesPlugin;
export { paperLayerType } from "./paper-texture.js";
export { canvasLayerType } from "./canvas-texture.js";
export { washiLayerType } from "./washi-texture.js";
export { noiseTextureLayerType } from "./noise-texture.js";
export { textureMcpTools } from "./texture-tools.js";
