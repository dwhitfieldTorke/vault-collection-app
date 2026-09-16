"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { newItemId } from "@/lib/items";
import ItemForm from "@/components/items/ItemForm";

export default function NewItemPage() {
  const { user } = useAuth();
  const itemId = useMemo(() => newItemId(), []);

  if (!user) return null;

  return (
    <div>
      <h1 className="text-xl font-display font-semibold text-ink mb-6">Add to the vault</h1>
      <ItemForm ownerId={user.uid} itemId={itemId} defaultCategory="comic" />
    </div>
  );
}
