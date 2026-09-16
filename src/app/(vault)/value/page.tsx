"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getItems } from "@/lib/items";
import Stat from "@/components/Stat";
import {
  Item,
  CATEGORIES,
  CATEGORY_LABELS,
  itemTotalValue,
  itemTotalCost,
  isGradable,
  isRawGrade,
} from "@/types";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function ValuePage() {
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
    return <p className="text-ink-faint text-sm text-center py-12">Loading...</p>;
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = items.reduce((sum, i) => sum + itemTotalValue(i), 0);
  const totalCost = items.reduce((sum, i) => sum + itemTotalCost(i), 0);
  const marketTotal = items.reduce((sum, i) => sum + i.market * i.quantity, 0);
  const potentialGain = totalValue - totalCost;
  const overallROI = totalCost > 0 ? (potentialGain / totalCost) * 100 : null;
  const avgItemValue = totalItems > 0 ? totalValue / totalItems : 0;
  const highestValueItem = items.reduce<Item | null>(
    (max, i) => (max === null || i.value > max.value ? i : max),
    null
  );
  const gradedCount = items.filter((i) => isGradable(i.category) && !isRawGrade(i.gradeKey)).length;
  const variantCount = items.filter((i) => i.variant?.trim()).length;

  const totalDelta = totalValue - marketTotal;

  const biggestGaps = [...items]
    .sort((a, b) => Math.abs(b.value - b.market) - Math.abs(a.value - a.market))
    .slice(0, 10);

  return (
    <div>
      <h1 className="text-xl font-display font-semibold text-ink mb-5">Value</h1>

      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Your total</p>
            <p className="text-2xl font-display font-semibold text-ink">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-faint">Market total</p>
            <p className="text-2xl font-display font-semibold text-ink">
              {formatCurrency(marketTotal)}
            </p>
          </div>
        </div>
        <p className="text-sm text-ink-muted border-t border-border pt-3">
          {totalDelta === 0
            ? "Your collection is valued exactly at market."
            : `Your collection is valued ${formatCurrency(Math.abs(totalDelta))} ${
                totalDelta > 0 ? "above" : "below"
              } the market estimate.`}
        </p>
      </div>

      <h2 className="text-sm font-medium text-ink-muted mb-2">Collection statistics</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat label="Total items" value={String(totalItems)} />
        <Stat label="Total cost" value={formatCurrency(totalCost)} />
        <Stat label="Estimated value" value={formatCurrency(totalValue)} />
        <Stat
          label="Potential gain"
          value={`${potentialGain >= 0 ? "+" : "−"}${formatCurrency(Math.abs(potentialGain))}`}
          tone={potentialGain >= 0 ? "positive" : "negative"}
        />
        <Stat
          label="Overall ROI"
          value={overallROI != null ? `${overallROI >= 0 ? "+" : ""}${overallROI.toFixed(0)}%` : "—"}
          tone={overallROI != null ? (overallROI >= 0 ? "positive" : "negative") : "neutral"}
        />
        <Stat label="Average item value" value={formatCurrency(avgItemValue)} />
        <Stat
          label="Highest value item"
          value={highestValueItem ? formatCurrency(highestValueItem.value) : "—"}
          sublabel={highestValueItem?.title}
        />
        <Stat label="Graded items" value={String(gradedCount)} />
        <Stat label="Variants" value={String(variantCount)} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {CATEGORIES.map((c) => {
          const catItems = items.filter((i) => i.category === c);
          const total = catItems.reduce((sum, i) => sum + itemTotalValue(i), 0);
          const count = catItems.reduce((sum, i) => sum + i.quantity, 0);
          return (
            <div key={c} className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">
                {CATEGORY_LABELS[c]}
              </p>
              <p className="text-lg font-display font-semibold text-ink">{formatCurrency(total)}</p>
              <p className="text-xs text-ink-faint">
                {count} item{count === 1 ? "" : "s"}
              </p>
            </div>
          );
        })}
      </div>

      {biggestGaps.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-ink-muted mb-2">Biggest gaps vs. market</h2>
          <div className="space-y-2">
            {biggestGaps.map((item) => {
              const delta = item.value - item.market;
              return (
                <Link
                  key={item.itemId}
                  href={`/items/${item.itemId}`}
                  className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3 hover:border-accent transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{item.title}</p>
                    <p className="text-xs text-ink-faint">{CATEGORY_LABELS[item.category]}</p>
                  </div>
                  <p className={`text-sm shrink-0 ${delta === 0 ? "text-ink-faint" : delta > 0 ? "text-accent" : "text-red-600"}`}>
                    {delta === 0 ? "at est." : `${delta > 0 ? "+" : "−"}${formatCurrency(Math.abs(delta))}`}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
