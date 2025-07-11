"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useHasMatch } from "@/hooks/useHasMatch";
import { Span } from "next/dist/trace";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getDatabase, ref, onValue, off, remove } from "firebase/database";
import { dbRT } from "@/lib/firebase"; 

export default function Navbar({
  partner,
  matchId
}: {
  partner?: {name:string; avatarUrl: string; uid?: string } | null;
  matchId?: string | null;
}) {
    useOnlineStatus();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const hasMatch = useHasMatch();
    const [ isOnline, setIsOnline ] = useState(false);

    useEffect(() => {
      if (!partner?.uid) return;
      const statusRef = ref(dbRT, `/onlineUsers/${partner.uid}`);

      const unsubscribe = onValue(statusRef, (snapshot) => {
        setIsOnline(snapshot.exists()); // 有資料表示在線上
      });

      return () => {
        off(statusRef);
      };
    }, [partner?.uid]);


    useEffect(()=> {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsLoggedIn(!!user); // 有登入就 true, 沒登入就 false
      });

      return () => unsubscribe();
    }, []);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
      const user = auth.currentUser;
      if (user) {
        // 手動移除 onlineUsers 的資料
        const statusRef = ref(dbRT, `/onlineUsers/${user.uid}`);
        const connectedRef = ref(dbRT, ".info/connected");
        
        try {
          await remove(statusRef); // 刪除上線狀態
          off(connectedRef) // 關閉連線監聽

          console.log("成功主動移除 /onlineUsers");

        } catch (error) {
          console.error("移除 onlineUsers 失敗", error);
        }
      }

      await signOut(auth);
      setTimeout(() => {
        router.push("/");
      }, 300);
    };

    const buttons = (
      <>
          {isLoggedIn && hasMatch && (pathname !== "/chat") &&(
            <button
              className="
                text-sm rounded-full px-4 py-2 text-white cursor-pointer 
                bg-gradient-to-l from-purple-500 to-pink-300
                transition duration-300 ease-in-out
                hover:brightness-110"
                onClick={() => router.push("/chat")}
            >
              配對列表
            </button>
          )}

          {isLoggedIn && (pathname === "/" || pathname === "/explore" || 
            pathname.startsWith("/chat") || pathname.startsWith("/users/")) && (
            <button className="
                text-sm rounded-full px-4 py-2 text-white cursor-pointer
                bg-gradient-to-l from-purple-500 to-pink-300
                transition duration-300 ease-in-out
                hover:brightness-110"
                onClick= {()=> router.push("/profile")}
                >
                  我的主頁
            </button>
          )}

          {isLoggedIn &&  matchId && pathname.startsWith("/users/") && (
            <button 
              className="
                text-sm rounded-full px-4 py-2 text-white cursor-pointer 
                bg-gradient-to-l from-purple-500 to-pink-300
                transition duration-300 ease-in-out
                hover:brightness-110"
              onClick={() => router.push(`/chat/${matchId}`)}
              >
                返回聊天
            </button>
          )}

          {isLoggedIn ? (
            <button
              onClick={handleLogout} 
              className="
                  text-sm rounded-full px-4 py-2 text-white cursor-pointer
                  bg-gradient-to-l from-purple-500 to-pink-300
                  transition duration-300 ease-in-out
                  hover:brightness-110"
            >
              登出
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="
                  text-sm rounded-full px-4 py-2 text-white cursor-pointer
                  bg-gradient-to-l from-purple-500 to-pink-300
                  transition duration-300 ease-in-out
                  hover:brightness-110"
            >
              登入 / 註冊
            </button>
          )}
      </>
    );


    return (
      <nav className="flex justify-between items-center mb-1 sm:px-4 fixed top-0 left-0 right-0 
        bg-white w-full h-[80px] z-50 border-b-1 border-gray-200 shadow-sm">
        <Link href="/" className="cursor-pointer flex flex-col items-center justify-center">
          <img src="/butterfly.svg" alt="蝴蝶" className="w-20 h-12"/>  
          <div className="text-purple-600 text-md title pr-[2px]">MatchU</div>
        </Link>

        {partner && (
          <div className="flex items-center gap-2 md:ml-[180px]">
            {/* 線上狀態圓點 */}
            {partner?.uid && (
              <div 
                className={`w-3 h-3 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-gray-300"
                }`}
                title = {isOnline ? "線上" : "離線"}
                ></div>
            )}

            <img
              src={partner.avatarUrl}
              alt="對方頭像"
              className="w-15 h-15 rounded-full object-cover cursor-pointer"
              title={`查看${partner.name}的個人頁面`}
              onClick={() => router.push(`/users/${partner.uid}`)}
            />
            <div className="text-sm font-semibold text-gray-800">{partner.name}</div>
          </div>
        )}
        
        {/* 桌機版按鈕 */}
        <div className="hidden md:flex gap-1">
          {buttons}
        </div>

        {/* 手機版漢堡圖 */}
        <div className="md:hidden relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-700 focus:outline-none cursor-pointer mr-5"
          >
            {/* 漢堡圖 */}
            <svg className="w-6 h-6 text-purple-700 mt-[10px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* 下拉選單 */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white rounded-xl shadow z-50 flex flex-col gap-2 p-2 w-29">
              {buttons}
            </div>
          )}
        </div>
      </nav>
    );
}