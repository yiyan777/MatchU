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
import { addDoc, serverTimestamp } from "firebase/firestore";
import { useHasMatch } from "@/hooks/useHasMatch";


export default function ExplorePage() {
  const [currentUserGender, setCurrentUserGender] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const hasMatch = useHasMatch();
  const [photoIndex, setPhotoIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");
      setCurrentUserId(user.uid);

      const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
      const userData = userDoc.docs[0]?.data();

      if (userData?.gender) {
        setCurrentUserGender(userData.gender);
        const targetGender = userData.gender === "male" ? "female" : "male";
        const q = query(collection(db, "users"), where("gender", "==", targetGender));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id  // 將 UID 放進資料
        }));
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

  const handleLike = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const person = candidates[currentIndex];
    if (!person?.uid) return;

    try {
      // 新增 like 紀錄
      await addDoc(collection(db, "likes"), {
        from: user.uid,
        to: person.uid,
        createdAt: serverTimestamp()
      });

      // 檢查對方是否也對自己按過讚
      const q = query(
        collection(db, "likes"),
        where("from", "==", person.uid),
        where("to", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // 雙方互讚，建立配對
        await addDoc(collection(db, "matches"), {
          userIds: [user.uid, person.uid],
          matchedAt: serverTimestamp(),
          lastMessage: "",
          lastUpdated: serverTimestamp(),
        });

        alert("配對成功！可以開始聊天囉！💘");
      }

      // 顯示愛心動畫
      setShowHeart(true);

      setTimeout(() => {
        setShowHeart(false); 
        next(); 
      }, 500);
    } catch (error) {
      console.log("按讚失敗", error);
    }
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
  const avatarUrls = person.avatarUrls || [person.avatarUrl || "/default-avatar.png"];
  const totalPhotos = avatarUrls.length;

  const handlePrevPhoto = () => {
    setPhotoIndex((prev) => (prev -1 + totalPhotos) % totalPhotos);
  };

  const handleNextPhoto = () => {
    setPhotoIndex((prev) => (prev + 1) % totalPhotos);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar hasMatch={hasMatch} />
      <main className="relative mt-[80px] flex flex-col items-center p-4">
        <div className="
          w-full max-w-[300px] border border-gray-300 p-8 rounded 
          shadow-lg bg-white flex flex-col gap-2"
          >
          
          {/* 頭貼輪播 */}
          <div className="relative flex justify-center items-center">

            {avatarUrls[photoIndex] ? (
              <div className="relative w-28 h-44 mx-auto rounded-md shadow-md overflow-hidden">
                <Image
                  src = {avatarUrls[photoIndex]}
                  alt="對象頭貼"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : ( 
              <div className="w-28 h-44 mx-auto rounded-md shadow-md bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                無頭像
              </div>
            )}

            {totalPhotos > 1 && (
              <>
                <button onClick={handlePrevPhoto} className="absolute left-[10px]">
                  <img src="/arrows/left-arrow.png" alt="左箭頭" width={24} className="cursor-pointer" />
                </button>
                <button onClick={handleNextPhoto} className="absolute right-[10px]">
                  <img src="/arrows/right-arrow.png" alt="右箭頭" width={24} className="cursor-pointer" />
                </button>
              </>
            )}
          </div>

          {/* dot indicators */}
          { totalPhotos > 1 && (
            <div className="flex justify-center gap-2 mt-2">
              {avatarUrls.map((_: string, idx: number) => (
                <span
                  key = {idx}
                  className={`w-2 h-2 rounded-full ${idx === photoIndex ? "bg-purple-500" : "bg-gray-300"}`}
                />
              ))}
            </div>
          )}
          
          
          <h2 className="text-xl text-purple-400 font-sans font-bold text-center mt-4">{person.name}</h2>
          <div className="text-sm mt-2 text-gray-600">
            <p className="font-medium mb-1">自我介紹：</p>
            <p>{person.intro || "尚未填寫"}</p>  
          </div>

          <hr  className="border-gray-300 border-0.5"/>

          <div className="text-sm text-center mt-1 text-gray-600 flex flex-wrap">
            <span className="font-medium">我的興趣：</span>
            <div>
              {person.interests && person.interests.length > 0 ? (
                person.interests.map((interest: string, index: number) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm"  
                  >
                    {interest}
                  </span>  
                ))

              ) : ( <span className="text-gray-400">尚未填寫</span> )
              }
            </div>
          </div>

          <hr  className="border-gray-300 border-0.5"/>

          <p className="text-sm text-gray-600"><span className="font-medium">生活地點</span>：{person.location}</p>
        </div>  
        
        {showHeart && (
          <div className="absolute bottom-11 pointer-events-none z-50">
            <div className="text-pink-400 text-6xl animate-ping-fast">
              <Image src="/heart.png" alt="like" width={80} height={80} 
                className="rounded-full"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-5">
          <button className="cursor-pointer border border-gray-400 px-4 py-2
            rounded-full hover:bg-purple-100 text-sm"
            onClick={handleLike}
          >
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
