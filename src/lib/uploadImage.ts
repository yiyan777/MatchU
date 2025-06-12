// lib/uploadImage.ts

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export async function uploadImage(file: File, userId: string) {
  const storage = getStorage();
  const imageRef = ref(storage, `chat-images/${userId}/${uuidv4()}`);
  const snapshot = await uploadBytes(imageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return url;
} 