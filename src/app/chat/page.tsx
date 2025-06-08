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
  onSnapshot,
} from "firebase/firestore";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getDatabase, ref, onValue, off } from "firebase/database";


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
  unreadCount: number;
}

export default function ChatListPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState("");
  const router = useRouter();

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    const dbRT = getDatabase();
    const listenerUnsubs: (() => void)[] = [];
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        
        const q = query(
          collection(db, "matches"),
          where("userIds", "array-contains", user.uid),
          orderBy("lastUpdated", "desc") // 按照最新訊息排序
        );

        unsubscribeSnapshot = onSnapshot(q, async (snapshot) => {
          const matchList: MatchItem[] = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              const otherId = data.userIds.find((id: string) => id !== user.uid);
              const userDoc = await getDoc(doc(db, "users", otherId));
              const otherUser = userDoc.data();

              const avatarUrls = otherUser?.avatarUrls;
              const avatarUrl = Array.isArray(avatarUrls) && avatarUrls.length > 0
                ? avatarUrls[0]
                : "/default-avatar.png";

              return {
                id: docSnap.id,
                userIds: data.userIds,
                lastMessage: data.lastMessage || "",
                lastUpdated: data.lastUpdated?.toDate(),
                unreadCount: data.unreadCounts?.[user.uid] || 0,
                otherUser: {
                  uid: otherId,
                  name: otherUser?.name || "匿名",
                  avatarUrl,
                },
              };
            })
          );
          const filteredList = matchList.filter(Boolean) as MatchItem[];
          setMatches(filteredList);

          // 設定 Realtime Database 監聽對方是否在線
          filteredList.forEach((match) => {
              const onlineRef = ref(dbRT, `/onlineUsers/${match.otherUser.uid}`);
              const unsub = onValue(onlineRef, (snap) => {
                setOnlineMap((prev) => ({
                  ...prev,
                  [match.otherUser.uid]: snap.exists(),
                }));
              });
              listenerUnsubs.push(() => off(onlineRef));
          });

    });
  } else {
        router.push("/login");
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      listenerUnsubs.forEach((unsub) => unsub());
    };
  }, []);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <Navbar />
      <h1 className="text-2xl font-bold mb-4">聊天室</h1>
      <div className="space-y-4">
        {matches.map((match) => (
          <Link key={match.id} href={`/chat/${match.id}`}>
            <div className="flex items-center p-3 rounded-lg shadow hover:bg-gray-100 cursor-pointer mt-[40px]">
              <img
                src={match.otherUser.avatarUrl}
                alt="頭像"
                className="w-12 h-12 rounded-full object-cover mr-1"
              />
              
              <div 
                className={`mr-2 ml-1 flex flex-nowrap text-sm ${
                  onlineMap[match.otherUser.uid] ? "text-green-600" : "text-gray-400"
                }`}
                >
                  {onlineMap[match.otherUser.uid] ? "線上" : "離線"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="mt-1">

                  <span className="mr-2 font-semibold">{match.otherUser.name}</span>

                  {match.unreadCount > 0 && (
                    <span className="mr-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {match.unreadCount}
                    </span>
                  )}
                  <span className="block truncate text-gray-700">
                    {match.lastMessage || "開始聊天吧！"}
                  </span>
                  
                 </div>   

              </div>
              <div className="text-xs text-gray-400 text-right">
                {match.lastUpdated && (
                  <>
                    <div>
                      {new Date(match.lastUpdated).toLocaleDateString("zh-TW", {
                        month: "2-digit",
                        day: "2-digit",
                    })}
                    </div>
                    <div>
                      {new Date(match.lastUpdated).toLocaleTimeString("zh-TW", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    })}
                    </div>            
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}