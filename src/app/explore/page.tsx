// explore
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ExplorePage() {
  const [currentUserGender, setCurrentUserGender] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");

      const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
      const userData = userDoc.docs[0]?.data();

      if (userData?.gender) {
        setCurrentUserGender(userData.gender);
        const targetGender = userData.gender === "male" ? "female" : "male";
        const q = query(collection(db, "users"), where("gender", "==", targetGender));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => doc.data());
        setCandidates(shuffle(list)); // 自訂 shuffle 函式
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const shuffle = (array: any[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % candidates.length);
  };

  if (loading) return <div className="text-center mt-10">載入中...</div>;
  if (!candidates.length) {
    return( 
        <div>
            <div className="text-center mt-10">目前沒有推薦的對象</div>
            <button className="
                block m-auto mt-5 border border-gray-300 hover:bg-blue-100 
                cursor-pointer px-2 py-1 rounded"
                onClick={() => router.push("/profile")}
            >
                返回
            </button>
        </div>
    )
  }
  const person = candidates[currentIndex];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="mt-[80px] flex flex-col items-center p-4">
        <div className="w-full max-w-[300px] border border-gray-300 p-8 rounded shadow-lg bg-white">
          <img src={person.avatarUrl || "/default-avatar.png"} className="w-28 h-38 mx-auto rounded shadow-md" />
          <h2 className="text-xl text-purple-400 font-sans font-bold text-center mt-4">{person.name}</h2>
          <p className="text-sm text-center mt-2 text-gray-600">自我介紹：{person.intro}</p>
          <p className="text-sm text-center mt-1 text-gray-600">我的興趣：{person.interests?.join(", ")}</p>
          <p className="text-sm text-center mt-1 text-gray-600">生活地點：{person.location}</p>
        </div>

        <div className="mt-6 flex gap-5">
          <button className="cursor-pointer border border-gray-400 px-4 py-2
            rounded-full hover:bg-purple-100 text-sm"
          >
            {/* <Image src="/thumb_up.jpg" alt="按讚"  width={50} height={50} className="rounded-full" /> */}
            like
          </button>

          <button
            className="cursor-pointer border border-gray-400 px-4 
              py-2 rounded-full hover:bg-purple-100 text-sm"
            onClick={next}
          >
            next
          </button>
        </div>

      </main>
      <Footer />
    </div>
  );
}
