import Link from "next/link";
import Image from "next/image";
import { Item, gradeOption } from "@/types";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function deltaLabel(value: number, market: number): string {
  const delta = value - market;
  if (delta === 0) return "at est.";
  return `${delta > 0 ? "+" : "−"}${formatCurrency(Math.abs(delta))}`;
}

export default function ItemCard({ item, isNew }: { item: Item; isNew?: boolean }) {
  const grade = gradeOption(item.category, item.gradeKey);

  return (
    <Link
      href={`/items/${item.itemId}`}
      className="block bg-surface border border-border rounded-xl overflow-hidden hover:border-accent transition-colors"
    >
      <div className="aspect-[3/4] bg-canvas relative">
        {item.photoUrl ? (
          <Image
            src={item.photoUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-placeholder text-3xl font-display font-semibold">
            {initials(item.title)}
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-surface/90 text-ink-muted rounded-full px-2 py-0.5 border border-border">
          {grade.label}
        </span>
        {isNew && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" aria-label="New" />
        )}
        {item.edition && (
          <span className="absolute bottom-2 left-2 text-sm font-semibold bg-surface/90 text-ink rounded-full px-2.5 py-1 border border-border">
            {item.edition}
          </span>
        )}
        {item.quantity > 1 && (
          <span className="absolute bottom-2 right-2 text-xs font-medium bg-surface/90 text-ink-muted rounded-full px-2 py-0.5 border border-border">
            ×{item.quantity}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-ink text-sm font-medium truncate">{item.title}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-ink-muted text-xs">{formatCurrency(item.value)}</span>
          <span className="text-ink-faint text-xs">{deltaLabel(item.value, item.market)}</span>
        </div>
      </div>
    </Link>
  );
}

function initials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
