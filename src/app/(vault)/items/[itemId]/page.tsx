"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getItem, deleteItem } from "@/lib/items";
import { deleteItemPhoto } from "@/lib/photos";
import { Item, CATEGORY_LABELS } from "@/types";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function ItemDetailPage({ params }: PageProps<"/items/[itemId]">) {
  const { itemId } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getItem(itemId);
    setItem(data);
    setLoading(false);
  }, [itemId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Remove "${item.name}" from your vault? This can't be undone.`)) return;
    setDeleting(true);
    await Promise.all(item.photoUrls.map((url) => deleteItemPhoto(url)));
    await deleteItem(item.itemId);
    router.push("/items");
  }

  if (loading) {
    return <div className="text-gray-500 text-sm py-12 text-center">Loading item...</div>;
  }

  if (!item) {
    return (
      <div className="text-gray-500 text-sm py-12 text-center">
        Item not found.{" "}
        <Link href="/items" className="text-amber-400 hover:text-amber-300">
          Back to items
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-gray-500 text-sm">{CATEGORY_LABELS[item.category]}</p>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {item.name}
            {item.favorite && <span className="text-amber-400">★</span>}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/items/${item.itemId}/edit`}
            className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
          >
            {deleting ? "Removing..." : "Delete"}
          </button>
        </div>
      </div>

      {item.photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {item.photoUrls.map((url) => (
            <div key={url} className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-800">
              <Image src={url} alt={item.name} fill sizes="160px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        {item.purchasePrice != null && (
          <InfoRow label="Purchase price" value={formatCurrency(item.purchasePrice)} />
        )}
        {item.currentValue != null && (
          <InfoRow label="Current value" value={formatCurrency(item.currentValue)} />
        )}
        {item.acquiredDate != null && (
          <InfoRow label="Acquired" value={formatDate(item.acquiredDate)} />
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-3">{CATEGORY_LABELS[item.category]} details</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(item.details).map(([key, value]) => {
            if (value === undefined || value === "") return null;
            return (
              <InfoRow
                key={key}
                label={humanizeKey(key)}
                value={typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
              />
            );
          })}
        </div>
      </div>

      {item.notes && (
        <div className="mb-6">
          <h2 className="text-white font-semibold mb-2">Notes</h2>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{item.notes}</p>
        </div>
      )}

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded-full px-3 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-gray-200 text-sm">{value}</p>
    </div>
  );
}

function humanizeKey(key: string): string {
  const spaced = key.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
