export function hexToRgba(hex: string): [number, number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, 255];
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp255(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Multiply blend: dst * src / 255 */
export function blendMultiply(dst: number, src: number): number {
  return clamp255((dst * src) / 255);
}
