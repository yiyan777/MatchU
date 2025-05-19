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

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <Navbar />
      <main className="
        p-6 max-w-lg mx-auto sm:mt-[90px] border border-gray-300 
        rounded shadow-md "
      >
        <h1 className="text-2xl text-center mb-6 text-gray-500 font-sans font-bold">
          我的個人資料
        </h1>

        {/* 大頭貼 */}
        <div className="flex justify-center mb-4">
          <Image
            src={userData.avatarUrl || "/default-avatar.png"}
            alt="頭像"
            width={100}
            height={100}
            className="rounded border shadow"
          />
        </div>

        {/* 文字資料 */}
        <div className="space-y-2 text-gray-700 text-md">
          <div><strong>*暱稱：</strong>{userData.name || "未命名"}</div>
          <div><strong>*Email：</strong>{userData.email}</div>
          <div><strong>*自我介紹：</strong>{userData.intro || "尚未填寫"}</div>
          <div><strong>*興趣：</strong>{userData.interests?.join(", ") || "尚未填寫"}</div>
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
