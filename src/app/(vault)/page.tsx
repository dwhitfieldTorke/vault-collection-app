"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getItems } from "@/lib/items";
import {
  Item,
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_TAB_LABELS,
  CATEGORY_SLUGS,
  itemTotalValue,
  itemTotalCost,
  isRawGrade,
} from "@/types";
import ProfileIcon from "@/components/ProfileIcon";
import Stat from "@/components/Stat";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function ShelfPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getItems(user.uid);
    setAllItems(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSelect(value: string) {
    if (value === "all") {
      router.push("/browse");
      return;
    }
    router.push(`/${value}`);
  }

  const collectionTotal = allItems.reduce((sum, i) => sum + itemTotalValue(i), 0);

  const comics = allItems.filter((i) => i.category === "comic");
  const totalComics = comics.reduce((sum, i) => sum + i.quantity, 0);
  const comicsCost = comics.reduce((sum, i) => sum + itemTotalCost(i), 0);
  const comicsValue = comics.reduce((sum, i) => sum + itemTotalValue(i), 0);
  const comicsGain = comicsValue - comicsCost;
  const highestValueComic = comics.reduce<Item | null>(
    (max, i) => (max === null || i.value > max.value ? i : max),
    null
  );
  const gradedComics = comics.filter((i) => !isRawGrade(i.gradeKey)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-display font-semibold text-ink">Vault</h1>
        <ProfileIcon email={user?.email ?? null} />
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">Collection value</p>
        <p className="text-2xl font-display font-semibold text-ink mb-3">
          {loading ? "…" : formatCurrency(collectionTotal)}
        </p>
        <div className="border-t border-border pt-3 grid grid-cols-2 gap-3">
          {CATEGORIES.map((c) => {
            const count = allItems
              .filter((i) => i.category === c)
              .reduce((sum, i) => sum + i.quantity, 0);
            return (
              <div key={c}>
                <p className="text-xs text-ink-faint">{CATEGORY_LABELS[c]}</p>
                <p className="text-sm text-ink">
                  {loading ? "…" : `${count} item${count === 1 ? "" : "s"}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {!loading && comics.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-ink-muted mb-2">Comics</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Stat label="Total comics" value={String(totalComics)} />
            <Stat label="Total cost" value={formatCurrency(comicsCost)} />
            <Stat label="Estimated value" value={formatCurrency(comicsValue)} />
            <Stat
              label="Potential gain"
              value={`${comicsGain >= 0 ? "+" : "−"}${formatCurrency(Math.abs(comicsGain))}`}
              tone={comicsGain >= 0 ? "positive" : "negative"}
            />
            <Stat
              label="Highest value comic"
              value={highestValueComic ? formatCurrency(highestValueComic.value) : "—"}
              sublabel={highestValueComic?.title}
            />
            <Stat label="Graded comics" value={String(gradedComics)} />
          </div>
        </>
      )}

      <h2 className="text-sm font-medium text-ink-muted mb-2">Browse</h2>
      <div className="relative">
        <select
          defaultValue=""
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full appearance-none bg-surface border border-border rounded-lg pl-3.5 pr-9 py-2.5 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          <option value="" disabled>
            Go to a category...
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={CATEGORY_SLUGS[c]}>
              {CATEGORY_TAB_LABELS[c]}
            </option>
          ))}
          <option value="all">All categories (browse)</option>
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
    </div>
  );
}
