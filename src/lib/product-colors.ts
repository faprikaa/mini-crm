import { hashString, seededRandom } from "./color-utils";

export function getProductColor(productName: string): string {
  const normalized = productName.trim().toLowerCase();
  const seed = hashString(normalized);
  const minLightness = 38;
  const maxLightness = 82;

  const hue = seededRandom(seed + 1) * 360;
  const lightness =
    minLightness + seededRandom(seed + 2) * (maxLightness - minLightness);
  const chroma = 0.07 + seededRandom(seed + 3) * 0.14;

  return `oklch(${lightness}% ${chroma.toFixed(2)} ${hue.toFixed(1)})`;
}
