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
  EDITION_LABELS,
  SOURCE_LABELS,
  gradeOption,
  gradesFor,
  computeMarket,
  isGradable,
  toFormData,
} from "@/types";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function ItemDetailPage({ params }: PageProps<"/items/[itemId]">) {
  const { itemId } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [gradingCost, setGradingCost] = useState<number | undefined>();

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
        <Link href="/" className="text-sm text-ink-muted hover:text-ink">
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
          <p className="text-sm text-ink-muted truncate">
            {[item.edition, item.source].filter(Boolean).join(" · ")}
          </p>
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
            <p className="text-xs uppercase tracking-wide text-ink-faint">Market est.</p>
            <p className="text-xl font-display font-semibold text-ink">
              {formatCurrency(item.market)}
            </p>
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <p className="text-sm text-ink-muted mb-3">
            {delta === 0
              ? "Your value matches the market estimate."
              : `You are ${formatCurrency(Math.abs(delta))} ${
                  delta > 0 ? "over" : "under"
                } the market estimate of ${formatCurrency(item.market)}.`}
          </p>
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

      <dl className="grid grid-cols-2 gap-3 mb-6">
        <MetaRow label={EDITION_LABELS[item.category]} value={item.edition || "—"} />
        <MetaRow label={SOURCE_LABELS[item.category]} value={item.source || "—"} />
        {item.variant && <MetaRow label="Variant" value={item.variant} />}
        <MetaRow label="Year" value={item.year ? String(item.year) : "—"} />
        <MetaRow
          label="Cover price"
          value={item.coverPrice != null ? formatCurrency(item.coverPrice) : "—"}
        />
        <MetaRow label="Condition" value={`${grade.label} · ${grade.note}`} />
        <MetaRow label="Quantity" value={String(item.quantity)} />
        <MetaRow
          label="Purchase price"
          value={item.purchasePrice != null ? formatCurrency(item.purchasePrice) : "—"}
        />
      </dl>

      {isGradable(item.category) && item.basePrice > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-6">
          <h2 className="text-ink font-display font-semibold mb-1">What if I graded this?</h2>
          <p className="text-xs text-ink-faint mb-3">
            Estimated value at each grade, based on your base market price of{" "}
            {formatCurrency(item.basePrice)}.
          </p>

          <label className="block text-xs font-medium uppercase tracking-wide text-ink-faint mb-1.5">
            Grading cost
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={gradingCost ?? ""}
            onChange={(e) => setGradingCost(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="e.g. 25"
            className="w-full bg-canvas border border-border rounded-lg px-3.5 py-2.5 text-ink text-sm placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent mb-4"
          />

          <div className="space-y-2">
            {[...gradesFor(item.category)]
              .sort((a, b) => a.multiplier - b.multiplier)
              .map((g) => {
                const gradeValue = computeMarket(item.category, g.key, item.basePrice);
                const isCurrent = g.key === item.gradeKey;
                const netGain =
                  gradeValue - item.value - (gradingCost ?? 0);
                const showNetGain = !isCurrent && gradeValue > item.value;

                return (
                  <div
                    key={g.key}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                      isCurrent ? "border-accent bg-accent-tint" : "border-border"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {g.label}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-accent">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink-faint">{g.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display font-semibold text-ink">
                        {formatCurrency(gradeValue)}
                      </p>
                      {showNetGain && (
                        <p className={`text-xs ${netGain >= 0 ? "text-accent" : "text-red-600"}`}>
                          {netGain >= 0 ? "+" : "−"}
                          {formatCurrency(Math.abs(netGain))} net
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}
