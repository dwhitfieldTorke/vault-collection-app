"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ItemFormData,
  ItemCategory,
  CATEGORIES,
  CATEGORY_LABELS,
  emptyFormData,
  ComicDetails,
  TradingCardDetails,
  VideoGameDetails,
  LegoDetails,
  VIDEO_GAME_CONDITIONS,
  VIDEO_GAME_CONDITION_LABELS,
  LEGO_BOX_CONDITIONS,
  LEGO_BOX_CONDITION_LABELS,
} from "@/types";
import { createItem, updateItem } from "@/lib/items";
import PhotoUploader from "@/components/items/PhotoUploader";

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
  const [tagsInput, setTagsInput] = useState((initialData?.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setCategory(category: ItemCategory) {
    setForm(emptyFormData(category));
  }

  function setDetails(details: ItemFormData["details"]) {
    setForm((prev) => ({ ...prev, details } as ItemFormData));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const data: ItemFormData = { ...form, tags };

    try {
      if (isEditing) {
        await updateItem(itemId, data);
      } else {
        await createItem(itemId, ownerId, data);
      }
      router.push(`/items/${itemId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <Section title="Category">
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
          <p className="text-xs text-gray-500 mt-1">Category can&apos;t be changed after an item is created.</p>
        )}
      </Section>

      <Section title="Basic info">
        <Field label="Name">
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={input()}
            placeholder="e.g. Amazing Spider-Man #300"
          />
        </Field>

        <Field label="Photos">
          <PhotoUploader
            ownerId={ownerId}
            itemId={itemId}
            photoUrls={form.photoUrls}
            onChange={(urls) => set("photoUrls", urls)}
          />
        </Field>
      </Section>

      <Section title={CATEGORY_LABELS[form.category] + " details"}>
        {form.category === "comic" && (
          <ComicFields details={form.details} onChange={setDetails} />
        )}
        {form.category === "trading_card" && (
          <TradingCardFields details={form.details} onChange={setDetails} />
        )}
        {form.category === "video_game" && (
          <VideoGameFields details={form.details} onChange={setDetails} />
        )}
        {form.category === "lego" && (
          <LegoFields details={form.details} onChange={setDetails} />
        )}
      </Section>

      <Section title="Value & provenance">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Acquired date">
            <input
              type="date"
              value={form.acquiredDate ? new Date(form.acquiredDate).toISOString().slice(0, 10) : ""}
              onChange={(e) =>
                set("acquiredDate", e.target.value ? new Date(e.target.value).getTime() : undefined)
              }
              className={input()}
            />
          </Field>
          <div />
          <Field label="Purchase price (USD)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.purchasePrice ?? ""}
              onChange={(e) =>
                set("purchasePrice", e.target.value ? Number(e.target.value) : undefined)
              }
              className={input()}
            />
          </Field>
          <Field label="Current value (USD)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.currentValue ?? ""}
              onChange={(e) =>
                set("currentValue", e.target.value ? Number(e.target.value) : undefined)
              }
              className={input()}
            />
          </Field>
        </div>
      </Section>

      <Section title="Notes & tags">
        <Field label="Notes">
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className={`${input()} resize-none`}
            placeholder="Condition notes, provenance, anything worth remembering..."
          />
        </Field>
        <Field label="Tags (comma separated)">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className={input()}
            placeholder="e.g. graded, holiday-gift, wishlist"
          />
        </Field>
        <Checkbox
          label="Favorite"
          checked={form.favorite}
          onChange={(v) => set("favorite", v)}
        />
      </Section>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-950 font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
        >
          {saving ? "Saving..." : isEditing ? "Save changes" : "Add to vault"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-sm px-4 py-2.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Category-specific field groups ──────────────────────────────────

function ComicFields({
  details,
  onChange,
}: {
  details: ComicDetails;
  onChange: (d: ComicDetails) => void;
}) {
  const set = <K extends keyof ComicDetails>(key: K, value: ComicDetails[K]) =>
    onChange({ ...details, [key]: value });

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Series">
          <input
            required
            value={details.series}
            onChange={(e) => set("series", e.target.value)}
            className={input()}
          />
        </Field>
        <Field label="Issue number">
          <input
            required
            value={details.issueNumber}
            onChange={(e) => set("issueNumber", e.target.value)}
            className={input()}
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Publisher">
          <input
            value={details.publisher ?? ""}
            onChange={(e) => set("publisher", e.target.value)}
            className={input()}
          />
        </Field>
        <Field label="Year">
          <input
            type="number"
            value={details.year ?? ""}
            onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)}
            className={input()}
          />
        </Field>
        <Field label="Variant">
          <input
            value={details.variant ?? ""}
            onChange={(e) => set("variant", e.target.value)}
            className={input()}
          />
        </Field>
      </div>
      <Field label="Grade (e.g. CGC 9.8, Raw)">
        <input
          value={details.grade ?? ""}
          onChange={(e) => set("grade", e.target.value)}
          className={input()}
        />
      </Field>
      <Checkbox
        label="Key issue"
        checked={details.keyIssue}
        onChange={(v) => set("keyIssue", v)}
      />
    </>
  );
}

function TradingCardFields({
  details,
  onChange,
}: {
  details: TradingCardDetails;
  onChange: (d: TradingCardDetails) => void;
}) {
  const set = <K extends keyof TradingCardDetails>(key: K, value: TradingCardDetails[K]) =>
    onChange({ ...details, [key]: value });

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Game / category (e.g. Pokémon, MTG, Sports)">
          <input
            required
            value={details.game}
            onChange={(e) => set("game", e.target.value)}
            className={input()}
          />
        </Field>
        <Field label="Set name">
          <input
            value={details.setName ?? ""}
            onChange={(e) => set("setName", e.target.value)}
            className={input()}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Card number">
          <input
            value={details.cardNumber ?? ""}
            onChange={(e) => set("cardNumber", e.target.value)}
            className={input()}
          />
        </Field>
        <Field label="Subject (player/character)">
          <input
            value={details.subject ?? ""}
            onChange={(e) => set("subject", e.target.value)}
            className={input()}
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Year">
          <input
            type="number"
            value={details.year ?? ""}
            onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)}
            className={input()}
          />
        </Field>
        <Field label="Grade (e.g. PSA 10, Raw)">
          <input
            value={details.grade ?? ""}
            onChange={(e) => set("grade", e.target.value)}
            className={input()}
          />
        </Field>
        <Field label="Rarity">
          <input
            value={details.rarity ?? ""}
            onChange={(e) => set("rarity", e.target.value)}
            className={input()}
          />
        </Field>
      </div>
    </>
  );
}

function VideoGameFields({
  details,
  onChange,
}: {
  details: VideoGameDetails;
  onChange: (d: VideoGameDetails) => void;
}) {
  const set = <K extends keyof VideoGameDetails>(key: K, value: VideoGameDetails[K]) =>
    onChange({ ...details, [key]: value });

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Platform">
          <input
            required
            value={details.platform}
            onChange={(e) => set("platform", e.target.value)}
            className={input()}
            placeholder="e.g. SNES, PS5, Switch"
          />
        </Field>
        <Field label="Condition">
          <select
            value={details.condition}
            onChange={(e) => set("condition", e.target.value as VideoGameDetails["condition"])}
            className={input()}
          >
            {VIDEO_GAME_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {VIDEO_GAME_CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Region">
          <input
            value={details.region ?? ""}
            onChange={(e) => set("region", e.target.value)}
            className={input()}
          />
        </Field>
        <Field label="Genre">
          <input
            value={details.genre ?? ""}
            onChange={(e) => set("genre", e.target.value)}
            className={input()}
          />
        </Field>
        <Field label="Year">
          <input
            type="number"
            value={details.year ?? ""}
            onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)}
            className={input()}
          />
        </Field>
      </div>
      <Field label="Publisher">
        <input
          value={details.publisher ?? ""}
          onChange={(e) => set("publisher", e.target.value)}
          className={input()}
        />
      </Field>
    </>
  );
}

function LegoFields({
  details,
  onChange,
}: {
  details: LegoDetails;
  onChange: (d: LegoDetails) => void;
}) {
  const set = <K extends keyof LegoDetails>(key: K, value: LegoDetails[K]) =>
    onChange({ ...details, [key]: value });

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Set number">
          <input
            required
            value={details.setNumber}
            onChange={(e) => set("setNumber", e.target.value)}
            className={input()}
          />
        </Field>
        <Field label="Theme">
          <input
            value={details.theme ?? ""}
            onChange={(e) => set("theme", e.target.value)}
            className={input()}
            placeholder="e.g. Star Wars, Technic, Icons"
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Box condition">
          <select
            value={details.boxCondition}
            onChange={(e) => set("boxCondition", e.target.value as LegoDetails["boxCondition"])}
            className={input()}
          >
            {LEGO_BOX_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {LEGO_BOX_CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Piece count">
          <input
            type="number"
            min={0}
            value={details.pieceCount ?? ""}
            onChange={(e) =>
              set("pieceCount", e.target.value ? Number(e.target.value) : undefined)
            }
            className={input()}
          />
        </Field>
        <Field label="Minifigs included">
          <input
            type="number"
            min={0}
            value={details.minifigsIncluded ?? ""}
            onChange={(e) =>
              set("minifigsIncluded", e.target.value ? Number(e.target.value) : undefined)
            }
            className={input()}
          />
        </Field>
      </div>
      <Field label="Year">
        <input
          type="number"
          value={details.year ?? ""}
          onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)}
          className={input()}
        />
      </Field>
    </>
  );
}

// ── Small primitives ──────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-white font-semibold mb-4 pb-2 border-b border-gray-800">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
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
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
          : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-amber-500 w-4 h-4 shrink-0"
      />
      <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
        {label}
      </span>
    </label>
  );
}

const input = () =>
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent";
