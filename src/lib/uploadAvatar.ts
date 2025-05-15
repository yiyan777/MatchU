// lib/uploadAvatar.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "./firebase";

export async function uploadAvatar(file: File): Promise<string> {
  const storage = getStorage();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("尚未登入");

  const avatarRef = ref(storage, `avatars/${uid}`);
  await uploadBytes(avatarRef, file);
  const downloadURL = await getDownloadURL(avatarRef);
  return downloadURL;
}
