"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getItems } from "@/lib/items";
import { Item, ItemCategory, CATEGORY_LABELS } from "@/types";
import ItemCard from "@/components/items/ItemCard";

type SortKey = "updated" | "name" | "value";

function ItemsPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") as ItemCategory | null;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getItems(user.uid, category ?? undefined);
    setItems(data);
    setLoading(false);
  }, [user, category]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "value") return (b.currentValue ?? 0) - (a.currentValue ?? 0);
      return b.updatedAt - a.updatedAt;
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">
          {category ? CATEGORY_LABELS[category] : "All items"}
        </h1>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="updated">Recently updated</option>
            <option value="name">Name (A-Z)</option>
            <option value="value">Value (high-low)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm py-12 text-center">Loading items...</div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm py-12 text-center">No items found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <ItemCard key={item.itemId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm py-12 text-center">Loading...</div>}>
      <ItemsPageInner />
    </Suspense>
  );
}
