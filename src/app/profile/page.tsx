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

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMatch = useHasMatch();

  const router = useRouter();

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
    <div className="min-h-screen flex flex-col m-auto">
      <Navbar hasMatch={hasMatch} />
      <main className="
        p-6 max-w-sm mx-auto mt-[80px] border border-gray-300 
        rounded shadow-md"
      >
        <h1 className="text-2xl text-center mb-6 text-gray-500 font-sans font-bold">
          我的個人資料
        </h1>

        {/* 頭貼輪播顯示 */}
        {userData.avatarUrls && userData.avatarUrls.length > 0 && (
          <div className="relative flex justify-center items-center mb-4">
            <img
              src={userData.avatarUrls[currentIndex]}
              alt="頭貼"
              className="w-[100px] h-[130px] mx-auto object-cover rounded shadow"
            />

            {userData.avatarUrls.length > 1 && currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="absolute left-[40px] sm:left-[70px] text-xl"
              >
                <img src="/arrows/left-arrow.png" alt="左箭頭" width={30} className="cursor-pointer" />
              </button>
            )}

            {userData.avatarUrls.length > 1 && currentIndex < userData.avatarUrls.length - 1 && (
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="absolute right-[40px] sm:right-[70px] text-xl"
              >
                <img src="/arrows/right-arrow.png" alt="右箭頭" width={30} className="cursor-pointer" />
              </button>
            )}
          </div>
        )}

        {/* 文字資料 */}
        <div className="space-y-2 text-gray-700 text-md">
          <div><strong>*暱稱：</strong>{userData.name || "未命名"}</div>
          <div><strong>*Email：</strong>{userData.email}</div>
          <div><strong>*自我介紹：</strong>{userData.intro || "尚未填寫"}</div>

          <div>
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
        </div>
      </main>
      <div className="flex justify-center gap-3 my-[20px] sm:mt-[40px]">
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

      <Footer />
    </div>
  );
}
