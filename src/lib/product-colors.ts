function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

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
