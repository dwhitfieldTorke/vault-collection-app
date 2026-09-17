"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getItem, updateItem, deleteItem } from "@/lib/items";
import { deleteItemPhoto } from "@/lib/photos";
import {
  Item,
  CATEGORY_LABELS,
  CATEGORY_SLUGS,
  EDITION_SHORT_LABELS,
  gradeOption,
  toFormData,
} from "@/types";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatRelativeTime(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / (60 * 1000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function ItemDetailPage({ params }: PageProps<"/items/[itemId]">) {
  const { itemId } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getItem(itemId);
    setItem(data);
    setLoading(false);
  }, [itemId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUseMarketEstimate() {
    if (!item) return;
    setBusy(true);
    await updateItem(item.itemId, { ...toFormData(item), value: item.market });
    await load();
    setBusy(false);
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Remove "${item.title}" from your vault? This can't be undone.`)) return;
    setBusy(true);
    if (item.photoUrl) await deleteItemPhoto(item.photoUrl);
    await deleteItem(item.itemId);
    router.push("/");
  }

  if (loading) {
    return <p className="text-ink-faint text-sm text-center py-12">Loading...</p>;
  }

  if (!item) {
    return (
      <p className="text-ink-faint text-sm text-center py-12">
        Item not found.{" "}
        <Link href="/" className="text-accent hover:text-accent-hover">
          Back to shelf
        </Link>
      </p>
    );
  }

  const grade = gradeOption(item.category, item.gradeKey);
  const delta = item.value - item.market;
  const sliderPosition = Math.round(grade.multiplier * 100);
  const totalValue = item.value * item.quantity;
  const totalCost = (item.purchasePrice ?? 0) * item.quantity;
  const profit = totalValue - totalCost;
  const roi = item.purchasePrice ? ((item.value - item.purchasePrice) / item.purchasePrice) * 100 : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link href={`/${CATEGORY_SLUGS[item.category]}`} className="text-sm text-ink-muted hover:text-ink">
          ← {CATEGORY_LABELS[item.category]}
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="w-24 h-32 shrink-0 rounded-lg overflow-hidden bg-canvas border border-border relative">
          {item.photoUrl ? (
            <Image src={item.photoUrl} alt={item.title} fill sizes="96px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-placeholder text-2xl font-display font-semibold">
              {item.title.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-display font-semibold text-ink">{item.title}</h1>
          {item.edition && (
            <p className="text-sm text-ink-muted truncate">
              {EDITION_SHORT_LABELS[item.category]}: {item.edition}
            </p>
          )}
          {item.source && <p className="text-sm text-ink-muted truncate">{item.source}</p>}
          <p className="text-sm text-ink-muted truncate">Qty: {item.quantity}</p>
          <span className="inline-block mt-2 text-xs uppercase tracking-wide bg-accent-tint text-ink rounded-full px-2.5 py-1">
            {grade.label}
          </span>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Your value</p>
            <p className="text-xl font-display font-semibold text-ink">
              {formatCurrency(item.value)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-faint">eBay median</p>
            <p className="text-xl font-display font-semibold text-ink">
              {formatCurrency(item.market)}
            </p>
          </div>
        </div>
        <div className="border-t border-border pt-3">
          {item.marketCheckedAt ? (
            <>
              <p className="text-sm text-ink-muted mb-1">
                {delta === 0
                  ? "Your value matches the eBay median."
                  : `You are ${formatCurrency(Math.abs(delta))} ${
                      delta > 0 ? "over" : "under"
                    } the eBay median of ${formatCurrency(item.market)}.`}
              </p>
              <p className="text-xs text-ink-faint mb-1">
                Range {formatCurrency(item.marketLow ?? item.market)} –{" "}
                {formatCurrency(item.marketHigh ?? item.market)} from{" "}
                {item.marketListingCount ?? 0} listing{item.marketListingCount === 1 ? "" : "s"} ·
                checked {formatRelativeTime(item.marketCheckedAt)}
              </p>
              {(item.marketGradedCount ?? 0) + (item.marketUngradedCount ?? 0) > 0 && (
                <p className="text-xs text-ink-faint mb-3">
                  {item.marketGradedCount ?? 0} graded
                  {item.marketGradedMedian != null && ` (${formatCurrency(item.marketGradedMedian)} median)`}
                  {" · "}
                  {item.marketUngradedCount ?? 0} ungraded
                  {item.marketUngradedMedian != null &&
                    ` (${formatCurrency(item.marketUngradedMedian)} median)`}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-faint mb-3">
              No eBay estimate yet —{" "}
              <Link href={`/items/${item.itemId}/edit`} className="text-accent hover:text-accent-hover">
                check on the Edit page
              </Link>
              .
            </p>
          )}
          <div className="h-1.5 rounded-full bg-border relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent"
              style={{ left: `calc(${sliderPosition}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between text-[10px] uppercase tracking-wide text-ink-faint mt-1">
            <span>Poor</span>
            <span>Mint</span>
          </div>
        </div>
      </div>

      {item.purchasePrice != null && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Profit</p>
            <p className={`text-lg font-display font-semibold ${profit >= 0 ? "text-ink" : "text-red-600"}`}>
              {profit >= 0 ? "+" : "−"}
              {formatCurrency(Math.abs(profit))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-faint">ROI</p>
            <p className={`text-lg font-display font-semibold ${(roi ?? 0) >= 0 ? "text-ink" : "text-red-600"}`}>
              {roi != null ? `${roi >= 0 ? "+" : ""}${roi.toFixed(0)}%` : "—"}
            </p>
          </div>
        </div>
      )}

      {item.note && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">Storage note</p>
          <p className="text-sm text-ink-muted whitespace-pre-wrap">{item.note}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleUseMarketEstimate}
          disabled={busy || delta === 0}
          className="bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-semibold rounded-full px-4 py-2 transition-colors"
        >
          Use market estimate
        </button>
        <Link
          href={`/items/${item.itemId}/edit`}
          className="text-sm text-ink-muted hover:text-ink border border-border hover:border-ink-faint rounded-full px-4 py-2 transition-colors"
        >
          Edit
        </Link>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full px-4 py-2 transition-colors disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
