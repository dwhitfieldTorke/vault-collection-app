import Link from "next/link";
import Image from "next/image";
import { Item, CATEGORY_LABELS } from "@/types";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item.itemId}`}
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-amber-500/50 transition-colors group"
    >
      <div className="aspect-square bg-gray-800 relative">
        {item.photoUrls[0] ? (
          <Image
            src={item.photoUrls[0]}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">
            {item.category === "comic" && "📖"}
            {item.category === "trading_card" && "🃏"}
            {item.category === "video_game" && "🎮"}
            {item.category === "lego" && "🧱"}
          </div>
        )}
        {item.favorite && (
          <span className="absolute top-2 right-2 text-amber-400 drop-shadow">★</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-white text-sm font-medium truncate group-hover:text-amber-400 transition-colors">
          {item.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-500 text-xs">{CATEGORY_LABELS[item.category]}</span>
          {item.currentValue != null && (
            <span className="text-gray-300 text-xs">{formatCurrency(item.currentValue)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
