// src/hooks/useOnlineStatus.ts
import { useEffect } from "react";
import { ref, onValue, onDisconnect, set, off } from "firebase/database";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { dbRT } from "@/lib/firebase";

export function useOnlineStatus() {
  useEffect(() => {
    const auth = getAuth();
    let connectedRef: ReturnType<typeof ref> | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const statusRef = ref(dbRT, `/onlineUsers/${user.uid}`);
        connectedRef = ref(dbRT, ".info/connected");

        onValue(connectedRef, (snap) => {
          if (snap.val() === true) {
            set(statusRef, true);
            onDisconnect(statusRef).remove(); // 離線時自動移除
          }
        });
      }
    });

    return () => {
      // 清除 auth listener
      unsubscribeAuth();

      // 清除 .info/connected 監聽（如果曾設過）
      if (connectedRef) {
        off(connectedRef);
      }
    };
  }, []);
}
