import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Item, ItemFormData, ItemCategory } from "@/types";

const COLLECTION = "items";

function isValidItem(data: unknown): data is Item {
  const d = data as Partial<Item>;
  return typeof d.title === "string" && typeof d.gradeKey === "string";
}

// Items saved before `quantity` existed don't have it — default to 1 rather
// than requiring a data migration.
function normalize(item: Item): Item {
  return { ...item, quantity: item.quantity ?? 1 };
}

// Firestore rejects fields explicitly set to `undefined` — strip them for a
// full document write (setDoc just omits the key, which is equivalent).
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
}

// For a partial updateDoc, omitting a key means "leave it alone" — not
// "clear it". So an `undefined` value (an optional field the user blanked
// out) needs Firestore's deleteField() sentinel to actually remove it,
// rather than silently leaving the old value in place.
function toUpdatePayload<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[key] = obj[key] === undefined ? deleteField() : obj[key];
  }
  return result;
}

export async function getItems(ownerId: string, category?: ItemCategory): Promise<Item[]> {
  const constraints = category
    ? [where("ownerId", "==", ownerId), where("category", "==", category)]
    : [where("ownerId", "==", ownerId)];
  const q = query(collection(db, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => d.data()).filter(isValidItem).map(normalize);
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getItem(itemId: string): Promise<Item | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, itemId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return isValidItem(data) ? normalize(data) : null;
  } catch {
    // Firestore rules reject reads for items you don't own — treat that
    // the same as "not found" rather than surfacing a permission error.
    return null;
  }
}

export function newItemId(): string {
  return doc(collection(db, COLLECTION)).id;
}

export async function createItem(
  itemId: string,
  ownerId: string,
  data: ItemFormData
): Promise<void> {
  const now = Date.now();
  const item = {
    ...stripUndefined(data),
    itemId,
    ownerId,
    createdAt: now,
    updatedAt: now,
  } as Item;
  await setDoc(doc(db, COLLECTION, itemId), item);
}

export async function updateItem(itemId: string, data: ItemFormData): Promise<void> {
  await updateDoc(doc(db, COLLECTION, itemId), {
    ...toUpdatePayload(data),
    updatedAt: Date.now(),
  });
}

export async function deleteItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, itemId));
}
