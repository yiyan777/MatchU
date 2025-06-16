// app/users/[uid]/page.tsx
"use client";

import { useEffect, useState } from "react";
import {useParams} from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc} from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { query, collection, where, getDocs} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type UserData = {
  name: string;
  intro: string;
  interests: string[];
  avatarUrls: string[];
  location: string,
  zodiacSign: string;
  occupation: string;
};


export default function UserPage() {
  const { uid } = useParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchId, setMatchId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!uid || typeof uid !== "string") return;
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      } else {
        setUserData(null);
      }
      setLoading(false);
    };
    
    fetchUser();
  }, [uid]);

  useEffect(() => {  
    const fetchMatchId = async () => {
      const authUser = auth.currentUser;
      if (!authUser || !uid || typeof uid !== "string") return;

      const q = query(
        collection(db, "matches"),
        where("userIds", "array-contains", authUser.uid)
      );

      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        if (data.userIds.includes(uid)) {
          setMatchId(docSnap.id);
          break;
        }
      }
    };

    fetchMatchId();
  }, [uid]); 

  if (loading) {
    return <div className="p-8 text-center text-gray-500">載入中…</div>;
  }

  if (!userData) {
    return <div className="p-8 text-center text-red-500">找不到使用者資料。</div>; 
  }

  return (
    <div className="flex flex-col min-h-screen bg-[url('/users-bg.jpg')] bg-cover bg-top bg-repeat">
      <Navbar matchId={matchId} />
      
      <div className="max-w-xs sm:max-w-lg mx-auto mt-24 sm:mt-20 p-6 bg-white shadow-lg rounded-2xl bg-white/90">
        {userData.avatarUrls.length > 0 ? (
          <div className="w-[130px] mx-auto flex overflow-x-auto gap-4 pb-4">
            {userData.avatarUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`頭貼 ${index+ 1}`}
                className="w-30 h-50 object-cover rounded-2xl flex-shrink-0"
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 mb-4">尚未上傳頭貼</div>
        )}

        <h1 className="text-center text-2xl text-purple-700 mt-4">{userData.name}</h1>
        <p className="text-gray-500">♡ 自我介紹：</p>
        <p className="text-gray-500 pl-5">{userData.intro}</p>
        <div className="text-gray-500 mt-2">
          <div>♡ 地點：{userData.location}</div>
          <div>♡ 星座：{userData.zodiacSign}</div>
          <div>♡ 職業：{userData.occupation}</div>
        </div>


        {userData.interests?.length > 0 && (
          <div className="mt-2">
            <h2 className="text-md text-gray-500 mb-2">♡ 興趣：</h2>
            <div className="flex flex-wrap gap-2">
              {userData.interests.map((tag, index) => (
                <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      
      </div>
      <Footer />
    </div>
  )
}