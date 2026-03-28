import { describe, it, expect, vi } from "vitest";
import { textureMcpTools } from "../src/texture-tools.js";
import type { McpToolContext, DesignLayer } from "@genart-dev/core";

function createMockContext(): McpToolContext {
  const layers: DesignLayer[] = [];
  return {
    canvasWidth: 800,
    canvasHeight: 600,
    layers: {
      add: vi.fn((layer: DesignLayer) => { layers.push(layer); }),
      getAll: vi.fn(() => [...layers]),
      updateProperties: vi.fn(),
      removeLayer: vi.fn(),
      getLayer: vi.fn((id: string) => layers.find((l) => l.id === id)),
    },
    emitChange: vi.fn(),
  } as unknown as McpToolContext;
}

function findTool(name: string) {
  return textureMcpTools.find((t) => t.name === name)!;
}

describe("texture MCP tools", () => {
  it("has 7 tools", () => {
    expect(textureMcpTools).toHaveLength(7);
  });

  it("all tools have name, description, inputSchema, handler", () => {
    for (const tool of textureMcpTools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.handler).toBe("function");
    }
  });

  it("tool names match expected set", () => {
    const names = textureMcpTools.map((t) => t.name);
    expect(names).toEqual([
      "add_paper_texture",
      "add_canvas_texture",
      "add_washi_texture",
      "add_noise_texture",
      "add_linen_texture",
      "add_parchment_texture",
      "add_concrete_texture",
    ]);
  });

  describe("add_paper_texture", () => {
    it("adds a paper layer with defaults", async () => {
      const ctx = createMockContext();
      const result = await findTool("add_paper_texture").handler({}, ctx);
      expect(result.isError).toBeUndefined();
      expect(ctx.layers.add).toHaveBeenCalledTimes(1);
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.type).toBe("textures:paper");
      expect(layer.properties.preset).toBe("cold-press");
    });

    it("applies preset override", async () => {
      const ctx = createMockContext();
      await findTool("add_paper_texture").handler({ preset: "rough" }, ctx);
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.properties.preset).toBe("rough");
    });

    it("applies opacity and seed", async () => {
      const ctx = createMockContext();
      await findTool("add_paper_texture").handler({ opacity: 0.5, seed: 42 }, ctx);
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.opacity).toBe(0.5);
      expect(layer.properties.seed).toBe(42);
    });

    it("passes index to layers.add", async () => {
      const ctx = createMockContext();
      await findTool("add_paper_texture").handler({ index: 3 }, ctx);
      expect(ctx.layers.add).toHaveBeenCalledWith(expect.any(Object), 3);
    });
  });

  describe("add_canvas_texture", () => {
    it("adds a canvas layer with defaults", async () => {
      const ctx = createMockContext();
      const result = await findTool("add_canvas_texture").handler({}, ctx);
      expect(result.isError).toBeUndefined();
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.type).toBe("textures:canvas");
    });

    it("applies weaveScale override", async () => {
      const ctx = createMockContext();
      await findTool("add_canvas_texture").handler({ weaveScale: 12 }, ctx);
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.properties.weaveScale).toBe(12);
    });
  });

  describe("add_washi_texture", () => {
    it("adds a washi layer with defaults", async () => {
      const ctx = createMockContext();
      const result = await findTool("add_washi_texture").handler({}, ctx);
      expect(result.isError).toBeUndefined();
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.type).toBe("textures:washi");
    });

    it("applies fiberDensity override", async () => {
      const ctx = createMockContext();
      await findTool("add_washi_texture").handler({ fiberDensity: 0.8 }, ctx);
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.properties.fiberDensity).toBe(0.8);
    });
  });

  describe("add_noise_texture", () => {
    it("adds a noise layer with defaults", async () => {
      const ctx = createMockContext();
      const result = await findTool("add_noise_texture").handler({}, ctx);
      expect(result.isError).toBeUndefined();
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.type).toBe("textures:noise");
      expect(layer.properties.type).toBe("fractal");
    });

    it("applies noise type override", async () => {
      const ctx = createMockContext();
      await findTool("add_noise_texture").handler({ type: "ridged" }, ctx);
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.properties.type).toBe("ridged");
    });
  });

  describe("add_linen_texture", () => {
    it("adds a linen layer with defaults", async () => {
      const ctx = createMockContext();
      const result = await findTool("add_linen_texture").handler({}, ctx);
      expect(result.isError).toBeUndefined();
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.type).toBe("textures:linen");
    });

    it("applies threadSpacing override", async () => {
      const ctx = createMockContext();
      await findTool("add_linen_texture").handler({ threadSpacing: 5 }, ctx);
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.properties.threadSpacing).toBe(5);
    });
  });

  describe("add_parchment_texture", () => {
    it("adds a parchment layer with defaults", async () => {
      const ctx = createMockContext();
      const result = await findTool("add_parchment_texture").handler({}, ctx);
      expect(result.isError).toBeUndefined();
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.type).toBe("textures:parchment");
    });

    it("applies aging and foxingDensity overrides", async () => {
      const ctx = createMockContext();
      await findTool("add_parchment_texture").handler({ aging: 0.9, foxingDensity: 0.7 }, ctx);
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.properties.aging).toBe(0.9);
      expect(layer.properties.foxingDensity).toBe(0.7);
    });
  });

  describe("add_concrete_texture", () => {
    it("adds a concrete layer with defaults", async () => {
      const ctx = createMockContext();
      const result = await findTool("add_concrete_texture").handler({}, ctx);
      expect(result.isError).toBeUndefined();
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.type).toBe("textures:concrete");
    });

    it("applies coarseness and pitting overrides", async () => {
      const ctx = createMockContext();
      await findTool("add_concrete_texture").handler({ coarseness: 0.8, pitting: 0.9 }, ctx);
      const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
      expect(layer.properties.coarseness).toBe(0.8);
      expect(layer.properties.pitting).toBe(0.9);
    });
  });

  describe("layer structure", () => {
    it("all tools produce layers with blendMode multiply", async () => {
      for (const tool of textureMcpTools) {
        const ctx = createMockContext();
        await tool.handler({}, ctx);
        const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
        expect(layer.blendMode).toBe("multiply");
      }
    });

    it("all tools produce layers with full-canvas transform", async () => {
      for (const tool of textureMcpTools) {
        const ctx = createMockContext();
        await tool.handler({}, ctx);
        const layer = (ctx.layers.add as any).mock.calls[0][0] as DesignLayer;
        expect(layer.transform.width).toBe(800);
        expect(layer.transform.height).toBe(600);
      }
    });

    it("all tools call emitChange", async () => {
      for (const tool of textureMcpTools) {
        const ctx = createMockContext();
        await tool.handler({}, ctx);
        expect(ctx.emitChange).toHaveBeenCalledWith("layer-added");
      }
    });
  });
});
