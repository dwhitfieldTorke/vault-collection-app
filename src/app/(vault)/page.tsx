"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getItems } from "@/lib/items";
import { Item, CATEGORIES, CATEGORY_LABELS } from "@/types";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

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
    return <div className="text-gray-500 text-sm py-12 text-center">Loading your vault...</div>;
  }

  const totalValue = items.reduce((sum, i) => sum + (i.currentValue ?? 0), 0);
  const favorites = items.filter((i) => i.favorite).length;
  const recent = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total items" value={items.length.toString()} />
        <StatCard label="Estimated value" value={formatCurrency(totalValue)} />
        <StatCard label="Favorites" value={favorites.toString()} />
        <StatCard label="Categories" value={CATEGORIES.length.toString()} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {CATEGORIES.map((c) => {
          const count = items.filter((i) => i.category === c).length;
          const value = items
            .filter((i) => i.category === c)
            .reduce((sum, i) => sum + (i.currentValue ?? 0), 0);
          return (
            <Link
              key={c}
              href={`/items?category=${c}`}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-amber-500/50 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">{CATEGORY_LABELS[c]}</p>
              <p className="text-white text-xl font-bold">{count}</p>
              {value > 0 && <p className="text-gray-500 text-xs mt-1">{formatCurrency(value)}</p>}
            </Link>
          );
        })}
      </div>

      <h2 className="text-white font-semibold mb-4">Recently added</h2>
      {recent.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No items yet.{" "}
          <Link href="/items/new" className="text-amber-400 hover:text-amber-300">
            Add your first item
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-2">
          {recent.map((item) => (
            <Link
              key={item.itemId}
              href={`/items/${item.itemId}`}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 hover:border-gray-700 transition-colors"
            >
              <div>
                <p className="text-white text-sm font-medium">{item.name}</p>
                <p className="text-gray-500 text-xs">{CATEGORY_LABELS[item.category]}</p>
              </div>
              {item.currentValue != null && (
                <p className="text-gray-300 text-sm">{formatCurrency(item.currentValue)}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  );
}
