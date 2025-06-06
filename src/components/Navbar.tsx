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

export default function Navbar({
  partner,
}: {
  partner?: {name:string; avatarUrl: string } | null;
}) {
    useOnlineStatus();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const hasMatch = useHasMatch();

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
      await signOut(auth);
      setTimeout(() => {
        router.push("/");
      }, 300);
    };

    const buttons = (
      <>
          {isLoggedIn && hasMatch &&(
            <button
              className="
                text-sm rounded-full px-4 py-2 text-white cursor-pointer 
                bg-gradient-to-l from-purple-500 to-pink-300
                transition duration-300 ease-in-out
                hover:brightness-110"
                onClick={() => router.push("/chat")}
            >
              聊天列表
            </button>
          )}

          {isLoggedIn && (pathname === "/" || pathname === "/explore" || pathname === "/chat") && (
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
        bg-white w-full h-[80px] z-50 border-b-1 border-gray-200">
        <Link href="/" className="cursor-pointer flex flex-col items-center justify-center">
          <img src="/butterfly.svg" alt="蝴蝶" className="w-20 h-12"/>  
          <div className="text-purple-600 text-md title pr-[2px]">MatchU</div>
        </Link>

        {partner && (
          <div className="flex items-center gap-2">
            <img
              src={partner.avatarUrl}
              alt="對方頭像"
              className="w-15 h-15 rounded-full object-cover sm:ml-[97px]"
            />
            <div className="text-sm font-semibold text-gray-800">{partner.name}</div>
          </div>
        )}
        
        {/* 桌機版按鈕 */}
        <div className="hidden sm:flex gap-1">
          {buttons}
        </div>

        {/* 手機版漢堡圖 */}
        <div className="sm:hidden relative" ref={menuRef}>
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
            <div className="absolute right-0 mt-2 bg-white rounded-xl shadow z-50 flex flex-col gap-2 p-2 w-26">
              {buttons}
            </div>
          )}
        </div>
      </nav>
    );
}