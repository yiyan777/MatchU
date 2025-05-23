// src/app/profile/edit
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { uploadAvatar } from "@/lib/uploadAvatar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    name: "",
    intro: "",
    location: "",
    interests: [] as string[], // 調整興趣格式，從字串改成陣列
    gender: "",
    avatarUrl: "",
  });
  const [interestInput, setInterestInput] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || "",
            intro: data.intro || "",
            location: data.location || "",
            interests: data.interests || [],
            gender: data.gender || "",
            avatarUrl: data.avatarUrl || "",
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string); // 預覽圖片
    };
    reader.readAsDataURL(file);

    const url = await uploadAvatar(file);
    setFormData((prev) => ({ ...prev, avatarUrl: url }));

    // 立即更新 Firestore 中的 avatarUrl 欄位
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, "users", uid), { avatarUrl: url });
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
    });

    router.push("/profile");
  };

  if (loading) return <div className="text-center mt-10">載入中...</div>;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="p-6 max-w-lg mx-auto mt-[80px] border border-gray-300 rounded shadow-md bg-white">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-500 font-sans font-bold">編輯個人資料</h1>

        {/* 預覽大頭貼 */}
        {formData.avatarUrl || avatarPreview ? (
          <div className="flex justify-center mb-4">
            <img
              src={avatarPreview || formData.avatarUrl}
              alt="預覽頭像"
              className="w-[100px] border-none shadow rounded"
            />
          </div>
        ) : null}

        <label className="block mb-4 border border-gray-400 cursor-pointer">
          上傳大頭貼：
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="block w-full mt-1 cursor-pointer"
          />
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

        <label className="block mb-3">
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
