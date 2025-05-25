// lib/uploadAvatar.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "./firebase";
import { v4 as uuidv4 } from "uuid"; 

export async function uploadAvatar(file: File): Promise<string> {
  const storage = getStorage();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("尚未登入");

  // 使用 uuid 保證每張圖片都有唯一檔名
  const uniqueId = uuidv4();
  const avatarRef = ref(storage, `avatars/${uid}/${uniqueId}_${file.name}`);
  await uploadBytes(avatarRef, file);
  const downloadURL = await getDownloadURL(avatarRef);
  return downloadURL;
}
