import { getProductColor } from "@/lib/product-colors";

export function ProductAccentLabel({ name }: { name: string }) {
  return (
    <div
      className="inline-flex items-center rounded-base border-2 border-border px-2.5 py-1 font-base text-sm"
      style={{ borderColor: getProductColor(name) }}
    >
      {name}
    </div>
  );
}
