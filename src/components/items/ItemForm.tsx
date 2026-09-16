"use client";

import { useState } from "react";
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
  computeMarket,
} from "@/types";
import { createItem, updateItem } from "@/lib/items";

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

  function set<K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setCategory(category: ItemCategory) {
    const gradeKey = gradesFor(category)[0].key;
    setForm((prev) => ({
      ...prev,
      category,
      gradeKey,
      market: computeMarket(category, gradeKey, prev.basePrice),
    }));
  }

  function setGrade(gradeKey: string) {
    setForm((prev) => ({
      ...prev,
      gradeKey,
      market: computeMarket(prev.category, gradeKey, prev.basePrice),
    }));
  }

  function setBasePrice(basePrice: number) {
    setForm((prev) => ({
      ...prev,
      basePrice,
      market: computeMarket(prev.category, prev.gradeKey, basePrice),
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
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className={input()}
            />
          </Field>
        </div>
        <Field label="Variant / edition">
          <input
            value={form.variant ?? ""}
            onChange={(e) => set("variant", e.target.value)}
            className={input()}
            placeholder="e.g. 1st print, holo, collector's edition"
          />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Year">
            <input
              type="number"
              value={form.year ?? ""}
              onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)}
              className={input()}
            />
          </Field>
          <Field label="Cover price">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.coverPrice ?? ""}
              onChange={(e) =>
                set("coverPrice", e.target.value ? Number(e.target.value) : undefined)
              }
              className={input()}
              placeholder="e.g. 3.99"
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

      <Section title="Value">
        <Field label="Base market price (at top grade)">
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.basePrice || ""}
            onChange={(e) => setBasePrice(e.target.value ? Number(e.target.value) : 0)}
            className={input()}
          />
        </Field>

        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-ink-faint mb-1">Market estimate</p>
          <p className="text-xl font-semibold font-display text-ink">
            {formatCurrency(form.market)}
          </p>
        </div>

        <div className="flex items-end gap-3">
          <Field label="Your value">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.value || ""}
              onChange={(e) => set("value", e.target.value ? Number(e.target.value) : 0)}
              className={input()}
            />
          </Field>
          <button
            type="button"
            onClick={() => set("value", form.market)}
            className="mb-0.5 text-sm text-accent hover:text-accent-hover whitespace-nowrap px-3 py-2.5"
          >
            Match est.
          </button>
        </div>
        {form.basePrice > 0 && (
          <p className="text-xs text-ink-faint">
            {delta === 0
              ? "At the market estimate."
              : `${delta > 0 ? "+" : ""}${formatCurrency(delta)} vs. estimate.`}
          </p>
        )}

        <Field label="Purchase price (per item)">
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.purchasePrice ?? ""}
            onChange={(e) =>
              set("purchasePrice", e.target.value ? Number(e.target.value) : undefined)
            }
            className={input()}
            placeholder="What you paid"
          />
        </Field>

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
