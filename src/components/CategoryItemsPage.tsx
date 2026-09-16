"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getItems } from "@/lib/items";
import {
  Item,
  ItemCategory,
  CATEGORY_LABELS,
  CATEGORY_SHELF_LABELS,
  SEARCH_PLACEHOLDERS,
  itemTotalValue,
} from "@/types";
import ItemCard from "@/components/items/ItemCard";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const NEW_WINDOW_MS = 1000 * 60 * 60 * 24;

export default function CategoryItemsPage({ category }: { category: ItemCategory }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getItems(user.uid, category);
    setItems(data);
    setLoading(false);
  }, [user, category]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((i) =>
    `${i.title} ${i.edition} ${i.source}`.toLowerCase().includes(search.toLowerCase())
  );
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + itemTotalValue(i), 0);
  const marketTotal = items.reduce((sum, i) => sum + i.market * i.quantity, 0);

  return (
    <div>
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">
        ← Vault
      </Link>

      <h1 className="text-xl font-display font-semibold text-ink mt-4 mb-1">
        {CATEGORY_LABELS[category]}
      </h1>
      <p className="text-sm text-ink-faint mb-5">
        {loading
          ? "Loading..."
          : `${itemCount} item${itemCount === 1 ? "" : "s"} on the ${
              CATEGORY_SHELF_LABELS[category]
            } · ${formatCurrency(total)} yours · ${formatCurrency(marketTotal)} market est.`}
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={SEARCH_PLACEHOLDERS[category]}
        className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-ink text-sm placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent mb-5"
      />

      {loading ? (
        <p className="text-ink-faint text-sm text-center py-12">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-ink-faint text-sm text-center py-12">
          {items.length === 0 ? "Nothing here yet." : "Nothing matches that."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => (
            <ItemCard key={item.itemId} item={item} isNew={now - item.createdAt < NEW_WINDOW_MS} />
          ))}
        </div>
      )}
    </div>
  );
}
