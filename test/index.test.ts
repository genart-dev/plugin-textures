import { describe, it, expect } from "vitest";
import texturesPlugin from "../src/index.js";

describe("texturesPlugin", () => {
  it("has correct id", () => {
    expect(texturesPlugin.id).toBe("textures");
  });

  it("has correct name", () => {
    expect(texturesPlugin.name).toBe("Textures");
  });

  it("has version 0.2.0", () => {
    expect(texturesPlugin.version).toBe("0.2.0");
  });

  it("registers all 7 layer types", () => {
    expect(texturesPlugin.layerTypes).toHaveLength(7);
    const typeIds = texturesPlugin.layerTypes!.map((lt) => lt.typeId);
    expect(typeIds).toContain("textures:paper");
    expect(typeIds).toContain("textures:canvas");
    expect(typeIds).toContain("textures:washi");
    expect(typeIds).toContain("textures:noise");
    expect(typeIds).toContain("textures:linen");
    expect(typeIds).toContain("textures:parchment");
    expect(typeIds).toContain("textures:concrete");
  });

  it("all layer types have render and createDefault", () => {
    for (const lt of texturesPlugin.layerTypes!) {
      expect(typeof lt.render).toBe("function");
      expect(typeof lt.createDefault).toBe("function");
    }
  });

  it("all layer types have category draw", () => {
    for (const lt of texturesPlugin.layerTypes!) {
      expect(lt.category).toBe("draw");
    }
  });

  it("registers 7 MCP tools", () => {
    expect(texturesPlugin.mcpTools).toHaveLength(7);
  });

  it("has empty tools and exportHandlers", () => {
    expect(texturesPlugin.tools).toHaveLength(0);
    expect(texturesPlugin.exportHandlers).toHaveLength(0);
  });

  it("initialize and dispose are callable", async () => {
    await expect(texturesPlugin.initialize({} as any)).resolves.toBeUndefined();
    expect(() => texturesPlugin.dispose()).not.toThrow();
  });
});
