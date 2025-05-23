"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

export function useHasMatch() {
    const [hasMatch, setHasMatch] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) return;
            const matchCheck = await getDocs(
                query(collection(db, "matches"), where("userIds", "array-contains", user.uid))
            );
            setHasMatch(!matchCheck.empty);
        });
        return () => unsubscribe();
    }, []);
    return hasMatch;
}