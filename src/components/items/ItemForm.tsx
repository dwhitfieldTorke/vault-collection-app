"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ItemFormData,
  ItemCategory,
  CATEGORIES,
  CATEGORY_LABELS,
  EDITION_LABELS,
  SOURCE_LABELS,
  emptyFormData,
  gradesFor,
  defaultGradeKey,
} from "@/types";
import { createItem, updateItem, getItems } from "@/lib/items";

interface ItemFormProps {
  ownerId: string;
  itemId: string;
  initialData?: ItemFormData;
  defaultCategory?: ItemCategory;
}

export default function ItemForm({ ownerId, itemId, initialData, defaultCategory }: ItemFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);
  const [form, setForm] = useState<ItemFormData>(
    initialData ?? emptyFormData(defaultCategory ?? "comic")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Once the user has directly edited these, stop auto-filling them from
  // other fields — an existing item's saved values count as "already set".
  const [valueTouched, setValueTouched] = useState(Boolean(initialData?.value));
  const [purchasePriceTouched, setPurchasePriceTouched] = useState(
    Boolean(initialData?.purchasePrice)
  );
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getItems(ownerId, form.category).then((items) => {
      if (cancelled) return;
      const unique = Array.from(new Set(items.map((i) => i.source).filter(Boolean))).sort();
      setSourceOptions(unique);
    });
    return () => {
      cancelled = true;
    };
  }, [ownerId, form.category]);

  function set<K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setCategory(category: ItemCategory) {
    setForm((prev) => ({ ...prev, category, gradeKey: defaultGradeKey(category) }));
  }

  function setGrade(gradeKey: string) {
    set("gradeKey", gradeKey);
  }

  async function handleMarketEstimate() {
    setEstimating(true);
    setEstimateError("");
    try {
      const res = await fetch("/api/ebay/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          title: form.title,
          edition: form.edition,
          source: form.source,
          gradeKey: form.gradeKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEstimateError(data.error ?? "Could not fetch an eBay estimate.");
        return;
      }
      setForm((prev) => ({
        ...prev,
        market: data.median,
        marketLow: data.low,
        marketHigh: data.high,
        marketListingCount: data.count,
        marketCheckedAt: Date.now(),
        value: valueTouched ? prev.value : data.median,
      }));
    } catch {
      setEstimateError("Could not fetch an eBay estimate.");
    } finally {
      setEstimating(false);
    }
  }

  function setCoverPrice(coverPrice: number | undefined) {
    setForm((prev) => ({
      ...prev,
      coverPrice,
      purchasePrice: purchasePriceTouched ? prev.purchasePrice : coverPrice,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (isEditing) {
        await updateItem(itemId, form);
      } else {
        await createItem(itemId, ownerId, form);
      }
      router.push(`/items/${itemId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setSaving(false);
    }
  }

  const grades = gradesFor(form.category);
  const delta = form.value - form.market;
  const marketGapPct = form.market > 0 ? (Math.abs(delta) / form.market) * 100 : 0;
  const profit = (form.value - (form.purchasePrice ?? 0)) * form.quantity;
  const roi = form.purchasePrice
    ? ((form.value - form.purchasePrice) / form.purchasePrice) * 100
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-xl">
      <Section title="Type">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={CATEGORY_LABELS[c]}
              active={form.category === c}
              disabled={isEditing}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
        {isEditing && (
          <p className="text-xs text-ink-faint mt-1">Type can&apos;t be changed after saving.</p>
        )}
      </Section>

      <Section title="Details">
        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={input()}
            placeholder="e.g. Amazing Spider-Man #300"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={EDITION_LABELS[form.category]}>
            <input
              value={form.edition}
              onChange={(e) => set("edition", e.target.value)}
              className={input()}
            />
          </Field>
          <Field label={SOURCE_LABELS[form.category]}>
            <input
              list="source-options"
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className={input()}
              autoComplete="off"
            />
            <datalist id="source-options">
              {sourceOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label="Cover price">
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.coverPrice ?? ""}
            onChange={(e) => setCoverPrice(e.target.value ? Number(e.target.value) : undefined)}
            className={input()}
            placeholder="e.g. 3.99"
          />
        </Field>
        <Field label="Variant / edition">
          <input
            value={form.variant ?? ""}
            onChange={(e) => set("variant", e.target.value)}
            className={input()}
            placeholder="e.g. 1st print, holo, collector's edition"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Year">
            <input
              type="number"
              value={form.year ?? ""}
              onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)}
              className={input()}
            />
          </Field>
          <Field label="Quantity">
            <input
              type="number"
              min={1}
              step="1"
              value={form.quantity}
              onChange={(e) => set("quantity", Math.max(1, Number(e.target.value) || 1))}
              className={input()}
            />
          </Field>
        </div>
      </Section>

      <Section title="Condition">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {grades.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGrade(g.key)}
              className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                form.gradeKey === g.key
                  ? "bg-accent-tint border-accent text-ink"
                  : "border-border text-ink-muted hover:border-accent/50"
              }`}
            >
              <span className="block text-sm font-medium">{g.label}</span>
              <span className="block text-xs text-ink-faint">{g.note}</span>
            </button>
          ))}
        </div>
      </Section>

      {isEditing && (
        <Section title="Value">
          <Field label="Purchase price (per item)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.purchasePrice ?? ""}
              onChange={(e) => {
                setPurchasePriceTouched(true);
                set("purchasePrice", e.target.value ? Number(e.target.value) : undefined);
              }}
              className={input()}
              placeholder="What you paid"
            />
          </Field>
          {form.coverPrice != null && !purchasePriceTouched && (
            <p className="text-xs text-ink-faint -mt-2">Defaulted from the cover price.</p>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-ink-faint">
                Market estimate (eBay)
              </label>
              <button
                type="button"
                onClick={handleMarketEstimate}
                disabled={estimating || !form.title}
                className="text-sm text-accent hover:text-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {estimating ? "Checking eBay..." : "Market estimate"}
              </button>
            </div>

            {estimateError && <p className="text-xs text-red-600 mb-2">{estimateError}</p>}

            {form.marketCheckedAt ? (
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-xl font-semibold font-display text-ink">
                  {formatCurrency(form.marketLow ?? form.market)} –{" "}
                  {formatCurrency(form.marketHigh ?? form.market)}
                </p>
                <p className="text-xs text-ink-faint mt-1">
                  Median {formatCurrency(form.market)} from {form.marketListingCount ?? 0} listing
                  {form.marketListingCount === 1 ? "" : "s"} · checked{" "}
                  {formatRelativeTime(form.marketCheckedAt)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink-faint">Not checked yet.</p>
            )}
          </div>

          <div className="flex items-end gap-3">
            <Field label="Your value">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.value || ""}
                onChange={(e) => {
                  setValueTouched(true);
                  set("value", e.target.value ? Number(e.target.value) : 0);
                }}
                className={input()}
              />
            </Field>
            <button
              type="button"
              onClick={() => {
                setValueTouched(false);
                set("value", form.market);
              }}
              disabled={!form.marketCheckedAt}
              className="mb-0.5 text-sm text-accent hover:text-accent-hover disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap px-3 py-2.5"
            >
              Match est.
            </button>
          </div>
          {form.marketCheckedAt && (
            <p
              className={`text-xs ${
                marketGapPct > 25 ? "text-amber-600" : "text-ink-faint"
              }`}
            >
              {delta === 0
                ? "At the eBay median."
                : `${delta > 0 ? "+" : ""}${formatCurrency(delta)} vs. eBay median${
                    marketGapPct > 25 ? " — double check?" : "."
                  }`}
            </p>
          )}

          {!!form.purchasePrice && (
            <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">Profit</p>
                <p
                  className={`text-lg font-semibold font-display ${
                    profit >= 0 ? "text-ink" : "text-red-600"
                  }`}
                >
                  {profit >= 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(profit))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">ROI</p>
                <p
                  className={`text-lg font-semibold font-display ${
                    (roi ?? 0) >= 0 ? "text-ink" : "text-red-600"
                  }`}
                >
                  {roi != null ? `${roi >= 0 ? "+" : ""}${roi.toFixed(0)}%` : "—"}
                </p>
              </div>
            </div>
          )}
        </Section>
      )}

      <Section title="Notes">
        <Field label="Storage note">
          <textarea
            value={form.note ?? ""}
            onChange={(e) => set("note", e.target.value)}
            rows={3}
            className={`${input()} resize-none`}
            placeholder="Where it lives, provenance, anything worth remembering..."
          />
        </Field>
      </Section>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-colors"
        >
          {saving ? "Saving..." : isEditing ? "Save changes" : "Add to shelf"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-ink-muted hover:text-ink text-sm px-4 py-2.5 rounded-full border border-border hover:border-ink-faint transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-ink font-display font-semibold mb-4 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wide text-ink-faint mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Chip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "bg-dark-surface border-dark-surface text-white"
          : "border-border text-ink-muted hover:border-ink-faint"
      }`}
    >
      {label}
    </button>
  );
}

const input = () =>
  "w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-ink text-sm placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent";
