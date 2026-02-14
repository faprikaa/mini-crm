function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getProductColor(productName: string): string {
  const hue = hashString(productName) % 360;
  return `oklch(86% 0.09 ${hue})`;
}
