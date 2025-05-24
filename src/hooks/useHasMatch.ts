// useHasMatch.ts
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export function useHasMatch() {
  const [hasMatch, setHasMatch] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) {
        setHasMatch(false);
        return;
      }

      const q = query(
        collection(db, "matches"),
        where("userIds", "array-contains", user.uid)
      );

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          setHasMatch(!snapshot.empty);
        },
        (error) => {
          console.error("useHasMatch snapshot error:", error);
          setHasMatch(false);
        }
      );
    });
    return () => {
      unsubscribeAuth(); // 取消 auth Listener
      if (unsubscribeSnapshot) unsubscribeSnapshot(); // 取消 Firestore listener
    };
  }, []);

  return hasMatch;
}