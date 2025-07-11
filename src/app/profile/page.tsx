// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useHasMatch } from "@/hooks/useHasMatch";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMatch = useHasMatch();
  const router = useRouter();
  const total = userData?.avatarUrls?.length || 0;
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? total -1 : prev -1 ));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === total -1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
      else{
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center mt-10">載入中...</div>;
  if (!userData) return <div className="text-center mt-10">尚未登入或找不到資料。</div>;

  return (
    <div className="min-h-screen flex flex-col m-auto bg-purple-100">
      <Navbar />
      <main className="
        p-6 max-w-xs sm:max-w-sm  mx-auto mt-[80px] border border-gray-300 
        rounded shadow-md bg-white"
      >
        <h1 className="text-2xl text-center mb-6 text-gray-500 font-sans font-bold">
          我的個人資料
        </h1>
  
        {userData.avatarUrls && userData.avatarUrls.length > 0 && (
          <>
            {/* 頭貼輪播容器：圖片 + 箭頭定位點 */}
            <div className="relative mx-auto mb-3">
              <div className="relative w-28 h-44 shadow-md mx-auto">
                {userData.avatarUrls[currentIndex] ? (
                  <Image
                    src={userData.avatarUrls[currentIndex]}
                    alt="頭貼"
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                    無頭像
                  </div>
                )}

                {/* 左箭頭 */}
                {userData.avatarUrls && userData.avatarUrls.length > 1 && (
                  <button
                    onClick={handlePrev}
                    className="absolute -left-10 top-1/2 -translate-y-1/2"
                  >
                    <ChevronLeftIcon className="w-6 h-6 text-gray-600 opacity-70 hover:opacity-100 cursor-pointer" />
                  </button>
                )}

                {/* 右箭頭 */}
                {userData.avatarUrls && userData.avatarUrls.length > 1 && (
                  <button
                    onClick={handleNext}
                    className="absolute -right-10 top-1/2 -translate-y-1/2"
                  >
                    <ChevronRightIcon className="w-6 h-6 text-gray-600 opacity-70 hover:opacity-100 cursor-pointer" />
                  </button>
                )}
              </div>
            </div>

            {/* dot indicators */}
            {userData.avatarUrls.length > 1 && (
              <div className="flex justify-center gap-2 mb-4">
                {userData.avatarUrls.map((_: string, idx: number) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      idx === currentIndex ? "bg-purple-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}





        <div className="flex justify-center gap-3 my-[20px] sm:mt-[20px]">
          <button 
            className="
              cursor-pointer border border-gray-400 px-4 
              py-2 rounded-full hover:bg-purple-100 text-sm"
              onClick={()=> router.push("/profile/edit") }
              >
                編輯個人資料
            </button>

          <button 
            className="
              cursor-pointer border border-gray-400 px-4 
              py-2 rounded-full hover:bg-purple-100 text-sm"
              onClick={()=> router.push("/explore") }
              >
                開始認識新朋友
            </button>          
        </div>
        {/* 文字資料 */}
        <div className="space-y-2 text-gray-700 text-md">
          <div><strong>*暱稱：</strong>{userData.name || "未命名"}</div>
          <div><strong>*Email：</strong>{userData.email}</div>
          <div><strong>*自我介紹：</strong>{userData.intro || "尚未填寫"}</div>

          <div className="max-w-[450px]">
            <strong>*興趣：</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {userData.interests && userData.interests.length > 0 ? (
                userData.interests.map((interest: string, index: number) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))
              ): (<span className="text-gray-400">尚未填寫</span>
              )}
            </div>
          </div>

          <div><strong>*地點：</strong>{userData.location || "尚未填寫"}</div>
          <div><strong>*星座：</strong>{userData.zodiacSign || "尚未填寫"}</div> 
          <div><strong>*職業：</strong>{userData.occupation || "尚未填寫"}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
