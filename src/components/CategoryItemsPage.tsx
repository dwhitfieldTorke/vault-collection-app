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

type SortOrder = "title-asc" | "title-desc" | "created-asc";

const SORT_LABELS: Record<SortOrder, string> = {
  "title-asc": "Alphabetical (A-Z)",
  "title-desc": "Alphabetical (Z-A)",
  "created-asc": "Order entered",
};

export default function CategoryItemsPage({ category }: { category: ItemCategory }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("title-asc");
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

  const filtered = items
    .filter((i) => `${i.title} ${i.edition} ${i.source}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "title-asc") return a.title.localeCompare(b.title);
      if (sort === "title-desc") return b.title.localeCompare(a.title);
      return a.createdAt - b.createdAt;
    });
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
        className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-ink text-sm placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent mb-3"
      />

      <div className="relative mb-5">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOrder)}
          className="w-full appearance-none bg-surface border border-border rounded-lg pl-3.5 pr-9 py-2.5 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          {(Object.keys(SORT_LABELS) as SortOrder[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

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
