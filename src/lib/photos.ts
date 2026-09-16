import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadItemPhoto(
  ownerId: string,
  itemId: string,
  file: File
): Promise<string> {
  const path = `items/${ownerId}/${itemId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteItemPhoto(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // Photo may already be gone — safe to ignore.
  }
}
