function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getProductColor(productName: string): string {
  const normalized = productName.trim().toLowerCase();
  const baseHash = hashString(normalized);
  const lightnessHash = hashString(`${normalized}:l`);
  const chromaHash = hashString(`${normalized}:c`);

  const hue = (baseHash * 137.508) % 360;
  const lightness = 58 + (lightnessHash % 18);
  const chroma = 0.08 + (chromaHash % 9) * 0.01;

  return `oklch(${lightness}% ${chroma.toFixed(2)} ${hue.toFixed(1)})`;
}
