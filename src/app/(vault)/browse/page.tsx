"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getItems } from "@/lib/items";
import { Item, CATEGORIES, CATEGORY_LABELS } from "@/types";
import ItemCard from "@/components/items/ItemCard";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const NEW_WINDOW_MS = 1000 * 60 * 60 * 24;

export default function BrowsePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getItems(user.uid);
    setItems(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-ink-faint text-sm text-center py-12">Loading...</p>;
  }

  const categoriesWithItems = CATEGORIES.map((c) => ({
    category: c,
    items: items.filter((i) => i.category === c),
  })).filter((group) => group.items.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <Link href="/" className="text-sm text-ink-muted hover:text-ink">
          ← Shelf
        </Link>
      </div>
      <h1 className="text-xl font-display font-semibold text-ink mb-6">All items</h1>

      {categoriesWithItems.length === 0 ? (
        <p className="text-ink-faint text-sm text-center py-12">
          Nothing here yet.{" "}
          <Link href="/items/new" className="text-accent hover:text-accent-hover">
            Add your first item
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-8">
          {categoriesWithItems.map(({ category, items: categoryItems }) => {
            const total = categoryItems.reduce((sum, i) => sum + i.value * i.quantity, 0);
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-ink font-display font-semibold">
                    {CATEGORY_LABELS[category]}
                  </h2>
                  <p className="text-xs text-ink-faint">
                    {categoryItems.length} item{categoryItems.length === 1 ? "" : "s"} ·{" "}
                    {formatCurrency(total)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {categoryItems.map((item) => (
                    <ItemCard
                      key={item.itemId}
                      item={item}
                      isNew={now - item.createdAt < NEW_WINDOW_MS}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
