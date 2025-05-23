// chat/page.tsx   顯示聊天對象列表
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface MatchItem {
  id: string;
  userIds: string[];
  lastMessage: string;
  lastUpdated: any;
  otherUser: {
    uid: string;
    name: string;
    avatarUrl: string;
  };
}

export default function ChatListPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        const q = query(
          collection(db, "matches"),
          where("userIds", "array-contains", user.uid)
        );

        const snapshot = await getDocs(q);

        const matchList: MatchItem[] = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const otherId = data.userIds.find((id: string) => id !== user.uid);
            const userDoc = await getDoc(doc(db, "users", otherId));
            const otherUser = userDoc.data();

            return {
              id: docSnap.id,
              userIds: data.userIds,
              lastMessage: data.lastMessage || "",
              lastUpdated: data.lastUpdated?.toDate(),
              otherUser: {
                uid: otherId,
                name: otherUser?.name || "匿名",
                avatarUrl: otherUser?.avatarUrl || "/default-avatar.png",
              },
            };
          })
        );
        setMatches(matchList);

        console.log("目前登入者:", user.uid);
        console.log("matches 文件數量:", snapshot.size);
      } else {
        router.push("/login");
      }
    });
  }, []);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <Navbar />
      <h1 className="text-2xl font-bold mb-4">聊天室</h1>
      <div className="space-y-4">
        {matches.map((match) => (
          <Link key={match.id} href={`/chat/${match.id}`}>
            <div className="flex items-center p-3 rounded-lg shadow hover:bg-gray-100 cursor-pointer">
              <img
                src={match.otherUser.avatarUrl}
                alt="頭像"
                className="w-12 h-12 rounded-full object-cover mr-3"
              />
              <div className="flex-1 mt-[80px]">
                <div className="font-semibold">{match.otherUser.name}</div>
                <div>{match.lastMessage || "開始聊天吧！"}</div>
              </div>
              <div className="text-xs text-gray-400 ml-2">
                {match.lastUpdated
                  ? new Date(match.lastUpdated).toLocaleDateString("zh-TW", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
