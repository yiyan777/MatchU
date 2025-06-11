// src/app/profile/edit
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { uploadAvatar } from "@/lib/uploadAvatar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    name: "",
    intro: "",
    location: "",
    interests: [] as string[], // 調整興趣格式，從字串改成陣列
    gender: "",
    avatarUrls: [] as string[], // 改支援多張圖片
    zodiacSign: "", // 星座
    occupation: "", // 職業
  });
  const [interestInput, setInterestInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();

          // 資料遷移 : 從avatarUrl ➜ avatarUrls
          let avatarUrls: string[] =[];
          if (Array.isArray(data.avatarUrls)) {
            avatarUrls = data.avatarUrls;
          } else if (data.avatarUrl) {
            avatarUrls = [data.avatarUrl];
            await updateDoc(docRef, {
              avatarUrls,
              avatarUrl: deleteField(),
            });
          }
          
          setFormData({
            name: data.name || "",
            intro: data.intro || "",
            location: data.location || "",
            interests: data.interests || [],
            gender: data.gender || "",
            avatarUrls,
            zodiacSign: data.zodiacSign || "",
            occupation: data.occupation || "",
          });
        }
      } else {
        router.push("/login");  // 若沒登入，強制導向 login 頁面
      }

      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadAvatar(file);
    const newAvatarUrls = [...formData.avatarUrls];
    
    if (newAvatarUrls.length >= 6) {
      alert("最多只能上傳 6 張圖片");
      return;
    }

    newAvatarUrls.push(url);
    setFormData((prev) => ({ ...prev, avatarUrls: newAvatarUrls }));

    // 立即更新 Firestore 中的 avatarUrl 欄位
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, "users", uid), { avatarUrls: newAvatarUrls });
    }
  };

  const handleDeleteAvatar = async (index: number) => {
    const newAvatarUrls = [...formData.avatarUrls];
    newAvatarUrls.splice(index, 1);

    setFormData((prev) => ({ ...prev, avatarUrls: newAvatarUrls }));
    setCurrentIndex(0); // 重設為第一張

    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, "users", uid), { avatarUrls: newAvatarUrls });
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await updateDoc(doc(db, "users", user.uid), {
      name: formData.name,
      intro: formData.intro,
      location: formData.location,
      gender: formData.gender,
      interests: formData.interests,
      avatarUrls: formData.avatarUrls,
      zodiacSign: formData.zodiacSign,
      occupation: formData.occupation,
    });

    router.push("/profile");
  };

  if (loading) return <div className="text-center mt-10">載入中...</div>;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="p-6 max-w-lg mx-auto mt-[80px] border border-gray-300 rounded shadow-md bg-white">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-500 font-sans font-bold">編輯個人資料</h1>

        {/* 頭貼輪播顯示 */}
        {formData.avatarUrls.length > 0 && (
          <div className="relative flex flex-col justify-center items-center mb-4">
            <img
              src={formData.avatarUrls[currentIndex]}
              alt="頭貼預覽"
              className="w-[100px] h-[150px] object-cover rounded shadow"
            />

            {/* 左箭頭 */}
            {formData.avatarUrls.length > 1 && currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="absolute left-[60px] text-xl"
              >
                <ChevronLeftIcon className="w-6 h-6 text-gray-600 opacity-70 hover:opacity-100 cursor-pointer" />
              </button>
            )}

            {/* 右箭頭 */}
            {formData.avatarUrls.length > 1 && currentIndex < formData.avatarUrls.length - 1 && (
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="absolute right-[60px] text-xl"
              >
                <ChevronRightIcon className="w-6 h-6 text-gray-600 opacity-70 hover:opacity-100 cursor-pointer" />
              </button>
            )}

            <button
              onClick={() => handleDeleteAvatar(currentIndex)}
              className="mt-2 text-gray-500 text-sm cursor-pointer"
            >
              刪除這張
            </button>
          </div>
        )}

        <label className="block mb-4 border border-gray-400 cursor-pointer p-2 rounded">
          上傳大頭貼：
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="block w-full mt-1 cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-1">最多可上傳 6 張照片</p>
          <p className="text-xs text-gray-500 mt-1">預設第 1 張為主頁大頭貼</p>
        </label>
        
        <label className="block mb-3">
          暱稱：
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="block w-full border border-gray-400 rounded p-2 mt-1"
          />
        </label>

        <label className="block mb-3">
          自我介紹：
          <textarea
            name="intro"
            value={formData.intro}
            onChange={handleChange}
            rows={3}
            className="block w-full border border-gray-400 rounded p-2 mt-1"
          />
        </label>

        <label className="block mb-3 max-w-[350px]">
          興趣：
          <div className="flex flex-wrap gap-2 mt-1 mb-2">
            {formData.interests.map((tag, index) => (
              <span 
                key={index}
                className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm cursor-pointer"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    interests: prev.interests.filter((_, i) => i !== index),
                  }));
                }}
              >
                {tag} x
              </span>
            ))}
          </div>

          <div className="flex gap-2 mt-1">
            <input 
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && interestInput.trim()) {
                  e.preventDefault();
                  if (!formData.interests.includes(interestInput.trim())) {
                    setFormData((prev) => ({
                      ...prev,
                      interests: [...prev.interests, interestInput.trim()],
                    }));
                  }
                  setInterestInput("");
                }
              }}
              placeholder="請輸入興趣後按新增或 Enter"
              className="block w-full border border-gray-400 rounded p-2"
            />
            <button 
              type="button"
              onClick={() => {
                if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
                  setFormData((prev) => ({
                    ...prev,
                    interests: [...prev.interests, interestInput.trim()],
                  }));
                  setInterestInput("");
                }
              }}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm whitespace-nowrap cursor-pointer"
            >
              新增
            </button>
          </div>
        </label>

        <label className="block mb-4">
          地點：
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="block w-full border border-gray-400 rounded p-2 mt-1"
          />
        </label>

        <label className="block mb-4">
          性別：
          <select 
            name="gender" 
            value={formData.gender} 
            onChange={handleChange} 
            className="block w-full border border-gray-400 rounded p-2 mt-1 cursor-pointer"
          >
            <option value="">請選擇</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
        </label>
        
        <label className="block mb-4">
          星座：
          <select
            name="zodiacSign"
            value={formData.zodiacSign}
            onChange={handleChange}
            className="block w-full border border-gray-400 rounded p-2 mt-1 cursor-pointer"
          >
            <option value="">請選擇</option>
            <option value="摩羯座">摩羯座</option>
            <option value="水瓶座">水瓶座</option>
            <option value="雙魚座">雙魚座</option>
            <option value="牡羊座">牡羊座</option>
            <option value="金牛座">金牛座</option>
            <option value="雙子座">雙子座</option>
            <option value="巨蟹座">巨蟹座</option>
            <option value="獅子座">獅子座</option>
            <option value="處女座">處女座</option>
            <option value="天秤座">天秤座</option>
            <option value="天蠍座">天蠍座</option>
            <option value="射手座">射手座</option>
          </select>  
        </label>
        
        <label className="block mb-4">
          職業：
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            className="block w-full border border-gray-400 rounded p-2 mt-1"
            placeholder="請輸入您的職業"
          />
        </label>
      </main>

      <div className="flex flex-row gap-2 m-auto mt-5">
        <button
          onClick={handleSave}
          className="cursor-pointer border border-gray-400 px-4 block
          py-2 rounded-full hover:bg-gray-100 text-sm"
        >
          儲存
        </button>
        <button
          onClick={()=> router.push("/profile")}
          className="cursor-pointer border border-gray-400 px-4 block
          py-2 rounded-full hover:bg-gray-100 text-sm"
        >
          返回
        </button>
      </div>

      <Footer />
    </div>
  );
}
