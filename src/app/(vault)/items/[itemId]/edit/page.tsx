"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getItem } from "@/lib/items";
import { Item, toFormData } from "@/types";
import ItemForm from "@/components/items/ItemForm";

export default function EditItemPage({ params }: PageProps<"/items/[itemId]/edit">) {
  const { itemId } = use(params);
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getItem(itemId).then((data) => {
      setItem(data);
      setLoading(false);
    });
  }, [itemId]);

  if (loading) {
    return <p className="text-ink-faint text-sm text-center py-12">Loading...</p>;
  }

  if (!item || !user) {
    return (
      <p className="text-ink-faint text-sm text-center py-12">
        Item not found.{" "}
        <Link href="/" className="text-accent hover:text-accent-hover">
          Back to shelf
        </Link>
      </p>
    );
  }

  const formData = toFormData(item);

  return (
    <div>
      <h1 className="text-xl font-display font-semibold text-ink mb-6">Edit item</h1>
      <ItemForm ownerId={user.uid} itemId={item.itemId} initialData={formData} />
    </div>
  );
}
