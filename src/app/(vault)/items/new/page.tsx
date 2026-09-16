"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { newItemId } from "@/lib/items";
import { ItemCategory } from "@/types";
import ItemForm from "@/components/items/ItemForm";

function NewItemPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const category = (searchParams.get("category") as ItemCategory | null) ?? "comic";
  const itemId = useMemo(() => newItemId(), []);

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Add item</h1>
      <ItemForm ownerId={user.uid} itemId={itemId} defaultCategory={category} />
    </div>
  );
}

export default function NewItemPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm py-12 text-center">Loading...</div>}>
      <NewItemPageInner />
    </Suspense>
  );
}
