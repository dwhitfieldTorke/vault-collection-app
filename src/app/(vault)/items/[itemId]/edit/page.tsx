"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getItem } from "@/lib/items";
import { Item, ItemFormData } from "@/types";
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
    return <div className="text-gray-500 text-sm py-12 text-center">Loading item...</div>;
  }

  if (!item || !user) {
    return (
      <div className="text-gray-500 text-sm py-12 text-center">
        Item not found.{" "}
        <Link href="/items" className="text-amber-400 hover:text-amber-300">
          Back to items
        </Link>
      </div>
    );
  }

  const formData = {
    category: item.category,
    name: item.name,
    photoUrls: item.photoUrls,
    details: item.details,
    acquiredDate: item.acquiredDate,
    purchasePrice: item.purchasePrice,
    currentValue: item.currentValue,
    notes: item.notes,
    tags: item.tags,
    favorite: item.favorite,
  } as ItemFormData;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Edit item</h1>
      <ItemForm ownerId={user.uid} itemId={item.itemId} initialData={formData} />
    </div>
  );
}
