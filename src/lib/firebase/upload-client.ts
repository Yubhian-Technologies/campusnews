"use client";

/**
 * Generic client-side upload to Firebase Storage under a per-user folder
 * (e.g. "reel-uploads", "article-uploads"), matching the storage.rules pattern
 * `{folder}/{uid}/{fileName}`. Returns a public download URL.
 */
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getClientAuth, getClientStorage } from "./client";

export async function uploadUserAsset(file: File, folder: string): Promise<string> {
  const uid = getClientAuth().currentUser?.uid;
  if (!uid) throw new Error("Please sign in again to upload.");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${uid}/${Date.now()}-${safe}`;
  const snap = await uploadBytes(ref(getClientStorage(), path), file);
  return getDownloadURL(snap.ref);
}
