// src/hooks/useOnlineStatus.ts
import { useEffect } from "react";
import { ref, onValue, onDisconnect, set, off } from "firebase/database";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { dbRT } from "@/lib/firebase";

export function useOnlineStatus() {
  useEffect(() => {
    const auth = getAuth();
    let connectedRef: ReturnType<typeof ref> | null = null;
    let statusRef: ReturnType<typeof ref> | null = null;
    let connectedCallback: ((snap: any) => void) | null = null;
    let isCancelled = false; 

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        statusRef = ref(dbRT, `/onlineUsers/${user.uid}`);
        connectedRef = ref(dbRT, ".info/connected");

        connectedCallback =  (snap) => {
          if (isCancelled) return; // 登出後或頁面卸載就不處理

          if (snap.val() === true && statusRef) {
            console.log("連上線，設定上線狀態");
            set(statusRef, true);
            onDisconnect(statusRef).remove(); // 離線時自動移除
          } else {
            console.log("掉線或尚未連線")
          }
        };

        onValue(connectedRef, connectedCallback);
      }
    });

    return () => {
      isCancelled = true; 
      
      unsubscribeAuth(); // 清除 auth listener

      // 清除 .info/connected 監聽（如果曾設過）
      if (connectedRef && connectedCallback) {
        off(connectedRef, "value", connectedCallback);
      }
    };
  }, []);
}
