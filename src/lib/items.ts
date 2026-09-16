import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Item, ItemFormData, ItemCategory } from "@/types";

const COLLECTION = "items";

export async function getItems(ownerId: string, category?: ItemCategory): Promise<Item[]> {
  const constraints = category
    ? [where("ownerId", "==", ownerId), where("category", "==", category)]
    : [where("ownerId", "==", ownerId)];
  const q = query(collection(db, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => d.data() as Item);
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getItem(itemId: string): Promise<Item | null> {
  const snap = await getDoc(doc(db, COLLECTION, itemId));
  return snap.exists() ? (snap.data() as Item) : null;
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
    ...data,
    itemId,
    ownerId,
    createdAt: now,
    updatedAt: now,
  } as Item;
  await setDoc(doc(db, COLLECTION, itemId), item);
}

export async function updateItem(itemId: string, data: ItemFormData): Promise<void> {
  await updateDoc(doc(db, COLLECTION, itemId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, itemId));
}
