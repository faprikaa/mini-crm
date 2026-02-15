import { hashString, seededRandom } from "./color-utils";

export function getTagColor(tagName: string): string {
  const seed = hashString(tagName);
  const hue = seededRandom(seed + 1) * 360;
  const lightness = 50 + seededRandom(seed + 2) * 30;
  return `oklch(${lightness.toFixed(1)}% 0.17 ${hue.toFixed(1)})`;
}
